// Odoo JSON-RPC client for orcest-ai/do integration
// Connects to Odoo ERP to sync subscriptions, invoices, and service data

const ODOO_URL = process.env.ODOO_URL || 'https://do.orcest.ai';
const ODOO_DB = process.env.ODOO_DB || 'orcest';

interface OdooAuthResult {
  uid: number;
  session_id: string;
}

interface OdooRecord {
  id: number;
  [key: string]: any;
}

// JSON-RPC call to Odoo
async function jsonRpc(url: string, method: string, params: any): Promise<any> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: Math.floor(Math.random() * 1000000),
    }),
  });

  if (!response.ok) {
    throw new Error(`Odoo HTTP error: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || data.error.data?.message || 'Odoo RPC error');
  }

  return data.result;
}

// Authenticate with Odoo
export async function odooAuthenticate(
  username: string,
  password: string
): Promise<OdooAuthResult | null> {
  try {
    const result = await jsonRpc(`${ODOO_URL}/web/session/authenticate`, 'call', {
      db: ODOO_DB,
      login: username,
      password: password,
    });

    if (result?.uid) {
      return {
        uid: result.uid,
        session_id: result.session_id,
      };
    }
    return null;
  } catch (error) {
    console.error('Odoo authentication failed:', error);
    return null;
  }
}

// Odoo API key-based authentication (for server-to-server)
export async function odooAuthenticateWithApiKey(apiKey: string): Promise<number | null> {
  try {
    const result = await jsonRpc(`${ODOO_URL}/jsonrpc`, 'call', {
      service: 'common',
      method: 'authenticate',
      args: [ODOO_DB, '', apiKey, {}],
    });
    return result || null;
  } catch (error) {
    console.error('Odoo API key auth failed:', error);
    return null;
  }
}

// Search and read records from Odoo
export async function odooSearchRead(
  uid: number,
  password: string,
  model: string,
  domain: any[],
  fields: string[],
  limit?: number,
  offset?: number
): Promise<OdooRecord[]> {
  try {
    const result = await jsonRpc(`${ODOO_URL}/jsonrpc`, 'call', {
      service: 'object',
      method: 'execute_kw',
      args: [
        ODOO_DB,
        uid,
        password,
        model,
        'search_read',
        [domain],
        {
          fields: fields,
          limit: limit || 100,
          offset: offset || 0,
        },
      ],
    });
    return result || [];
  } catch (error) {
    console.error(`Odoo search_read on ${model} failed:`, error);
    return [];
  }
}

// Fetch subscriptions from Odoo (sale.subscription or sale.order with recurring)
export async function fetchOdooSubscriptions(
  uid: number,
  password: string
): Promise<any[]> {
  // Try sale.subscription model (Odoo Enterprise)
  try {
    const subscriptions = await odooSearchRead(
      uid,
      password,
      'sale.order',
      [['is_subscription', '=', true]],
      [
        'name', 'partner_id', 'date_order', 'next_invoice_date',
        'amount_total', 'currency_id', 'state', 'subscription_state',
        'plan_id', 'payment_token_ids',
      ]
    );
    return subscriptions;
  } catch {
    // Fallback: try regular sale orders
    try {
      const orders = await odooSearchRead(
        uid,
        password,
        'sale.order',
        [['state', 'in', ['sale', 'done']]],
        [
          'name', 'partner_id', 'date_order', 'validity_date',
          'amount_total', 'currency_id', 'state',
        ]
      );
      return orders;
    } catch (error) {
      console.error('Odoo subscription fetch failed:', error);
      return [];
    }
  }
}

// Fetch invoices from Odoo
export async function fetchOdooInvoices(
  uid: number,
  password: string
): Promise<any[]> {
  try {
    const invoices = await odooSearchRead(
      uid,
      password,
      'account.move',
      [['move_type', '=', 'out_invoice']],
      [
        'name', 'partner_id', 'invoice_date', 'invoice_date_due',
        'amount_total', 'amount_residual', 'currency_id', 'state',
        'payment_state',
      ],
      50
    );
    return invoices;
  } catch (error) {
    console.error('Odoo invoice fetch failed:', error);
    return [];
  }
}

// Fetch products/services from Odoo
export async function fetchOdooProducts(
  uid: number,
  password: string
): Promise<any[]> {
  try {
    const products = await odooSearchRead(
      uid,
      password,
      'product.product',
      [['type', '=', 'service']],
      [
        'name', 'list_price', 'default_code', 'categ_id',
        'recurring_invoice', 'subscription_template_id',
      ],
      100
    );
    return products;
  } catch (error) {
    console.error('Odoo product fetch failed:', error);
    return [];
  }
}

// Test Odoo connection
export async function testOdooConnection(
  username: string,
  password: string
): Promise<{ success: boolean; message: string; uid?: number }> {
  try {
    const auth = await odooAuthenticate(username, password);
    if (auth) {
      return {
        success: true,
        message: `اتصال به Odoo موفق بود (UID: ${auth.uid})`,
        uid: auth.uid,
      };
    }
    return { success: false, message: 'احراز هویت Odoo ناموفق بود' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `خطا در اتصال به Odoo: ${msg}` };
  }
}

// Sync all data from Odoo
export async function syncFromOdoo(
  uid: number,
  password: string
): Promise<{
  subscriptions: any[];
  invoices: any[];
  products: any[];
}> {
  const [subscriptions, invoices, products] = await Promise.all([
    fetchOdooSubscriptions(uid, password),
    fetchOdooInvoices(uid, password),
    fetchOdooProducts(uid, password),
  ]);

  return { subscriptions, invoices, products };
}
