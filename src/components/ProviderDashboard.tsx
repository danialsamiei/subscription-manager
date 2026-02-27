'use client';

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify-icon/react';
import { DashboardSummary, Provider, Domain, ServiceSubscription } from '@/types';
import DomainTable from './DomainTable';
import ServiceSubscriptionTable from './ServiceSubscriptionTable';
import ProviderConfigModal from './ProviderConfigModal';
import AddDomainModal from './AddDomainModal';
import AddServiceSubModal from './AddServiceSubModal';
import OdooSyncPanel from './OdooSyncPanel';
import { formatToman } from '@/lib/currencyUtils';

const Container = styled.div`
  padding: 0 1rem;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const SummaryCard = styled(motion.div)<{ $accent?: string }>`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.2rem;
  border-left: 4px solid ${props => props.$accent || '#03DAC6'};
`;

const SummaryValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.25rem;
`;

const SummaryLabel = styled.div`
  font-size: 0.85rem;
  color: #999;
`;

const SummarySubValue = styled.div`
  font-size: 0.8rem;
  color: #03DAC6;
  margin-top: 0.25rem;
`;

const ProvidersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ProviderCard = styled(motion.div)<{ $color?: string }>`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.$color || '#03DAC6'};
    background: rgba(255, 255, 255, 0.08);
  }
`;

const ProviderHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const ProviderName = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: #fff;
  flex: 1;
`;

const StatusDot = styled.span<{ $status: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  background: ${props => {
    switch (props.$status) {
      case 'success': return '#4CAF50';
      case 'syncing': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#666';
    }
  }};
`;

const ProviderMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.8rem;
`;

const MetaBadge = styled.span<{ $variant?: string }>`
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  background: ${props => {
    switch (props.$variant) {
      case 'api': return 'rgba(3, 218, 198, 0.2)';
      case 'manual': return 'rgba(255, 152, 0, 0.2)';
      case 'domains': return 'rgba(69, 183, 209, 0.2)';
      case 'subs': return 'rgba(150, 206, 180, 0.2)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.$variant) {
      case 'api': return '#03DAC6';
      case 'manual': return '#FF9800';
      case 'domains': return '#45B7D1';
      case 'subs': return '#96CEB4';
      default: return '#ccc';
    }
  }};
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 2rem 0 1rem;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant?: string }>`
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  background: ${props => props.$variant === 'danger' ? '#E94560' : 'rgba(3, 218, 198, 0.2)'};
  color: ${props => props.$variant === 'danger' ? '#fff' : '#03DAC6'};
  border: 1px solid ${props => props.$variant === 'danger' ? '#E94560' : '#03DAC6'};

  &:hover {
    background: ${props => props.$variant === 'danger' ? '#c73a52' : '#03DAC6'};
    color: ${props => props.$variant === 'danger' ? '#fff' : '#080808'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
`;

const CostDisplay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

export default function ProviderDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [domains, setDomains] = useState<any[]>([]);
  const [serviceSubscriptions, setServiceSubscriptions] = useState<any[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [syncingProviders, setSyncingProviders] = useState<Set<number>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, domainsRes, subsRes, ratesRes] = await Promise.all([
        fetch('/api/dashboard-summary').then(r => r.json()),
        fetch('/api/domains').then(r => r.json()),
        fetch('/api/service-subscriptions').then(r => r.json()),
        fetch('/api/currency-rates').then(r => r.json()),
      ]);

      setSummary(summaryRes);
      setDomains(Array.isArray(domainsRes) ? domainsRes : []);
      setServiceSubscriptions(Array.isArray(subsRes) ? subsRes : []);
      setRates(ratesRes.rates || {});
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSync = async (providerId: number) => {
    setSyncingProviders(prev => new Set(prev).add(providerId));
    try {
      await fetch(`/api/providers/${providerId}/sync`, { method: 'POST' });
      await fetchData();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncingProviders(prev => {
        const next = new Set(prev);
        next.delete(providerId);
        return next;
      });
    }
  };

  const handleSyncAll = async () => {
    if (!summary?.providers) return;
    const activeProviders = summary.providers.filter(p => p.is_active);
    for (const provider of activeProviders) {
      if (provider.id) {
        await handleSync(provider.id);
      }
    }
  };

  const handleRefreshRates = async () => {
    try {
      await fetch('/api/currency-rates', { method: 'POST' });
      await fetchData();
    } catch (error) {
      console.error('Rate refresh failed:', error);
    }
  };

  const handleDeleteDomain = async (id: number) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;
    try {
      await fetch(`/api/domains/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Delete domain failed:', error);
    }
  };

  const handleDeleteSub = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;
    try {
      await fetch(`/api/service-subscriptions/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Delete subscription failed:', error);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
          در حال بارگذاری داشبورد...
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {/* Odoo Sync Panel */}
      <OdooSyncPanel />

      {/* Summary Cards */}
      <SummaryGrid>
        <SummaryCard
          $accent="#03DAC6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <SummaryValue>{summary?.totalDomains || 0}</SummaryValue>
          <SummaryLabel>کل دامنه‌ها</SummaryLabel>
          <SummarySubValue>
            {summary?.activeDomains || 0} فعال / {summary?.expiringDomains || 0} رو به انقضا
          </SummarySubValue>
        </SummaryCard>

        <SummaryCard
          $accent="#45B7D1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SummaryValue>{summary?.totalSubscriptions || 0}</SummaryValue>
          <SummaryLabel>اشتراک‌های سرویس</SummaryLabel>
          <SummarySubValue>
            {summary?.activeSubscriptions || 0} فعال / {summary?.expiringSubscriptions || 0} رو به انقضا
          </SummarySubValue>
        </SummaryCard>

        <SummaryCard
          $accent="#FF9800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CostDisplay>
            <SummaryValue>${summary?.totalMonthlyCostUSD?.toFixed(2) || '0.00'}</SummaryValue>
            <SummaryLabel>هزینه ماهانه (دلار)</SummaryLabel>
            <SummarySubValue>
              {summary?.totalMonthlyCostToman ? formatToman(summary.totalMonthlyCostToman) : '۰ تومان'}
            </SummarySubValue>
          </CostDisplay>
        </SummaryCard>

        <SummaryCard
          $accent={summary?.expiredDomains ? '#F44336' : '#4CAF50'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <SummaryValue>{summary?.expiredDomains || 0}</SummaryValue>
          <SummaryLabel>دامنه‌های منقضی</SummaryLabel>
          <SummarySubValue>
            {summary?.providers?.filter(p => p.is_active).length || 0} سرویس‌دهنده فعال
          </SummarySubValue>
        </SummaryCard>
      </SummaryGrid>

      {/* Providers Section */}
      <SectionHeader>
        <SectionTitle>
          <Icon icon="mdi:cloud-outline" style={{ fontSize: '1.5rem' }} />
          سرویس‌دهنده‌ها
        </SectionTitle>
        <ButtonGroup>
          <ActionButton onClick={handleRefreshRates}>
            <Icon icon="mdi:currency-usd" /> بروزرسانی نرخ ارز
          </ActionButton>
          <ActionButton onClick={handleSyncAll}>
            <Icon icon="mdi:sync" /> همگام‌سازی همه
          </ActionButton>
        </ButtonGroup>
      </SectionHeader>

      <ProvidersGrid>
        <AnimatePresence>
          {summary?.providers?.map((provider: any) => (
            <ProviderCard
              key={provider.id}
              $color={provider.color}
              onClick={() => {
                setSelectedProvider(provider);
                setIsConfigModalOpen(true);
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
            >
              <ProviderHeader>
                <Icon
                  icon={provider.icon || 'mdi:cloud'}
                  style={{ fontSize: '1.5rem', color: provider.color }}
                />
                <ProviderName>{provider.name}</ProviderName>
                <StatusDot $status={provider.sync_status || 'idle'} />
              </ProviderHeader>
              <ProviderMeta>
                {provider.auth_method === 'api_key' && <MetaBadge $variant="api">API</MetaBadge>}
                {provider.auth_method === 'login_2fa' && <MetaBadge $variant="manual">ورود دومرحله‌ای</MetaBadge>}
                {provider.auth_method === 'manual' && <MetaBadge $variant="manual">دستی</MetaBadge>}
                <MetaBadge $variant="domains">
                  {domains.filter((d: any) => d.provider_id === provider.id).length} دامنه
                </MetaBadge>
                <MetaBadge $variant="subs">
                  {serviceSubscriptions.filter((s: any) => s.provider_id === provider.id).length} اشتراک
                </MetaBadge>
              </ProviderMeta>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <ActionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSync(provider.id);
                  }}
                  disabled={syncingProviders.has(provider.id)}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  <Icon icon={syncingProviders.has(provider.id) ? 'mdi:loading' : 'mdi:sync'} />
                  {syncingProviders.has(provider.id) ? 'در حال همگام‌سازی...' : 'همگام‌سازی'}
                </ActionButton>
              </div>
              {provider.last_sync && (
                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.5rem' }}>
                  آخرین همگام‌سازی: {new Date(provider.last_sync).toLocaleString()}
                </div>
              )}
            </ProviderCard>
          ))}
        </AnimatePresence>
      </ProvidersGrid>

      {/* Domains Section */}
      <SectionHeader>
        <SectionTitle>
          <Icon icon="mdi:earth" style={{ fontSize: '1.5rem' }} />
          دامنه‌ها
        </SectionTitle>
        <ActionButton onClick={() => setIsAddDomainOpen(true)}>
          <Icon icon="mdi:plus" /> افزودن دامنه
        </ActionButton>
      </SectionHeader>

      {domains.length > 0 ? (
        <DomainTable
          domains={domains}
          rates={rates}
          onDelete={handleDeleteDomain}
        />
      ) : (
        <EmptyState>
          هنوز دامنه‌ای ثبت نشده. دامنه‌ها را دستی اضافه کنید یا از سرویس‌دهنده همگام‌سازی کنید.
        </EmptyState>
      )}

      {/* Service Subscriptions Section */}
      <SectionHeader>
        <SectionTitle>
          <Icon icon="mdi:card-account-details-outline" style={{ fontSize: '1.5rem' }} />
          اشتراک‌های سرویس
        </SectionTitle>
        <ActionButton onClick={() => setIsAddSubOpen(true)}>
          <Icon icon="mdi:plus" /> افزودن اشتراک
        </ActionButton>
      </SectionHeader>

      {serviceSubscriptions.length > 0 ? (
        <ServiceSubscriptionTable
          subscriptions={serviceSubscriptions}
          rates={rates}
          onDelete={handleDeleteSub}
        />
      ) : (
        <EmptyState>
          هنوز اشتراکی ثبت نشده. اشتراک‌ها را دستی اضافه کنید یا از سرویس‌دهنده همگام‌سازی کنید.
        </EmptyState>
      )}

      {/* Modals */}
      {isConfigModalOpen && selectedProvider && (
        <ProviderConfigModal
          provider={selectedProvider}
          onClose={() => {
            setIsConfigModalOpen(false);
            setSelectedProvider(null);
          }}
          onSave={async () => {
            await fetchData();
            setIsConfigModalOpen(false);
            setSelectedProvider(null);
          }}
        />
      )}

      {isAddDomainOpen && (
        <AddDomainModal
          providers={summary?.providers || []}
          onClose={() => setIsAddDomainOpen(false)}
          onSave={async () => {
            await fetchData();
            setIsAddDomainOpen(false);
          }}
        />
      )}

      {isAddSubOpen && (
        <AddServiceSubModal
          providers={summary?.providers || []}
          onClose={() => setIsAddSubOpen(false)}
          onSave={async () => {
            await fetchData();
            setIsAddSubOpen(false);
          }}
        />
      )}
    </Container>
  );
}
