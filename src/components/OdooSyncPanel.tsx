'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Icon } from '@iconify-icon/react';

const Panel = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
`;

const Input = styled.input`
  flex: 1;
  min-width: 150px;
  padding: 0.6rem 0.8rem;
  background: #2c2c2c;
  border: 1px solid #444;
  border-radius: 8px;
  color: #fff;
  font-size: 0.85rem;
  font-family: inherit;

  &:focus {
    border-color: #03DAC6;
    outline: none;
  }
`;

const Button = styled.button<{ $variant?: string }>`
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.3s;
  font-family: inherit;

  background: ${props => props.$variant === 'primary' ? '#8E24AA' : props.$variant === 'test' ? '#FF9800' : '#333'};
  color: #fff;

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResultBox = styled.div<{ $success: boolean }>`
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  line-height: 1.6;
  background: ${props => props.$success ? 'rgba(76, 175, 80, 0.12)' : 'rgba(244, 67, 54, 0.12)'};
  color: ${props => props.$success ? '#4CAF50' : '#F44336'};
`;

const StatRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
`;

const Stat = styled.div`
  font-size: 0.8rem;
  color: #999;

  strong {
    color: #03DAC6;
  }
`;

interface SyncResult {
  success: boolean;
  message: string;
  data?: {
    subscriptionsFound: number;
    subscriptionsImported: number;
    invoicesFound: number;
    invoicesImported: number;
    productsFound: number;
  };
}

export default function OdooSyncPanel() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setResult(null);
    try {
      const res = await fetch('/api/odoo/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, message: 'خطا در اتصال به سرور' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setResult(null);
    try {
      const res = await fetch('/api/odoo/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, message: 'خطا در همگام‌سازی با Odoo' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>
          <Icon icon="mdi:office-building" style={{ color: '#8E24AA', fontSize: '1.3rem' }} />
          همگام‌سازی با Orcest Odoo
        </PanelTitle>
        <span style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' }}>do.orcest.ai</span>
      </PanelHeader>

      <FormRow>
        <Input
          type="text"
          placeholder="نام کاربری Odoo"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          type="password"
          placeholder="رمز عبور Odoo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormRow>

      <FormRow>
        <Button $variant="test" onClick={handleTest} disabled={isTesting || !username || !password}>
          <Icon icon="mdi:connection" />
          {isTesting ? 'در حال تست...' : 'تست اتصال'}
        </Button>
        <Button $variant="primary" onClick={handleSync} disabled={isSyncing || !username || !password}>
          <Icon icon="mdi:sync" />
          {isSyncing ? 'در حال همگام‌سازی...' : 'همگام‌سازی'}
        </Button>
      </FormRow>

      {result && (
        <ResultBox $success={result.success}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Icon icon={result.success ? 'mdi:check-circle' : 'mdi:alert-circle'} />
            {result.message}
          </div>
          {result.data && (
            <StatRow>
              <Stat>اشتراک‌ها: <strong>{result.data.subscriptionsImported}</strong> از {result.data.subscriptionsFound}</Stat>
              <Stat>فاکتورها: <strong>{result.data.invoicesImported}</strong> از {result.data.invoicesFound}</Stat>
              <Stat>محصولات: <strong>{result.data.productsFound}</strong></Stat>
            </StatRow>
          )}
        </ResultBox>
      )}
    </Panel>
  );
}
