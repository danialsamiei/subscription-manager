'use client';

import styled from 'styled-components';
import { Icon } from '@iconify-icon/react';
import { formatJalaliDateWithMonth, formatIranTime, formatGregorianDate, formatUTCTime } from '@/lib/jalaliUtils';
import { convertToToman, formatToman } from '@/lib/currencyUtils';

const Table = styled.div`
  width: 100%;
  overflow-x: auto;
  margin-bottom: 2rem;
`;

const Row = styled.div<{ $status?: string }>`
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.5fr 1fr 1fr 1.2fr 0.8fr;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  margin-bottom: 4px;
  border-left: 3px solid ${props => {
    switch (props.$status) {
      case 'active': return '#4CAF50';
      case 'expiring_soon': return '#FF9800';
      case 'expired': return '#F44336';
      case 'trial': return '#03DAC6';
      case 'cancelled': return '#9E9E9E';
      default: return '#666';
    }
  }};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
`;

const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.5fr 1fr 1fr 1.2fr 0.8fr;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #333;
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const Cell = styled.div`
  font-size: 0.85rem;
  color: #ddd;

  @media (max-width: 768px) {
    &::before {
      content: attr(data-label);
      font-size: 0.7rem;
      color: #888;
      display: block;
      margin-bottom: 2px;
    }
  }
`;

const ServiceName = styled.div`
  font-weight: 600;
  color: #fff;
  font-size: 0.95rem;
`;

const ProviderBadge = styled.span<{ $color?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  background: ${props => props.$color ? `${props.$color}20` : 'rgba(255,255,255,0.1)'};
  color: ${props => props.$color || '#ccc'};
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
    switch (props.$status) {
      case 'active': return 'rgba(76, 175, 80, 0.2)';
      case 'expiring_soon': return 'rgba(255, 152, 0, 0.2)';
      case 'expired': return 'rgba(244, 67, 54, 0.2)';
      case 'trial': return 'rgba(3, 218, 198, 0.2)';
      case 'cancelled': return 'rgba(158, 158, 158, 0.2)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'active': return '#4CAF50';
      case 'expiring_soon': return '#FF9800';
      case 'expired': return '#F44336';
      case 'trial': return '#03DAC6';
      case 'cancelled': return '#9E9E9E';
      default: return '#999';
    }
  }};
`;

const DateDisplay = styled.div`
  font-size: 0.8rem;
`;

const JalaliDate = styled.div`
  color: #03DAC6;
  font-size: 0.75rem;
  direction: rtl;
`;

const TimeDisplay = styled.div`
  font-size: 0.7rem;
  color: #888;
`;

const CostDisplay = styled.div`
  font-size: 0.85rem;
`;

const TomanCost = styled.div`
  font-size: 0.75rem;
  color: #03DAC6;
  direction: rtl;
`;

const InfoBadge = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.7rem;
  margin-right: 4px;
  background: ${props => props.$active ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.15)'};
  color: ${props => props.$active ? '#4CAF50' : '#F44336'};
`;

const BillingBadge = styled.span`
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.7rem;
  background: rgba(3, 218, 198, 0.15);
  color: #03DAC6;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #E94560;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: rgba(233, 69, 96, 0.2);
  }
`;

interface Props {
  subscriptions: any[];
  rates: Record<string, number>;
  onDelete: (id: number) => void;
}

export default function ServiceSubscriptionTable({ subscriptions, rates, onDelete }: Props) {
  return (
    <Table>
      <HeaderRow>
        <div>سرویس</div>
        <div>سرویس‌دهنده</div>
        <div>تاریخ انقضا</div>
        <div>وضعیت</div>
        <div>تمدید خودکار / پرداخت</div>
        <div>هزینه</div>
        <div>عملیات</div>
      </HeaderRow>

      {subscriptions.map((sub: any) => {
        const status = sub.computed_status || sub.status;
        const tomanAmount = sub.renewal_cost && sub.renewal_currency
          ? convertToToman(sub.renewal_cost, sub.renewal_currency, rates)
          : null;

        return (
          <Row key={sub.id} $status={status}>
            <Cell data-label="سرویس">
              <ServiceName>{sub.service_name}</ServiceName>
              {sub.plan_name && (
                <div style={{ fontSize: '0.75rem', color: '#888' }}>
                  پلن: {sub.plan_name}
                </div>
              )}
              {sub.notes && (
                <div style={{ fontSize: '0.7rem', color: '#666' }}>
                  {sub.notes}
                </div>
              )}
            </Cell>

            <Cell data-label="سرویس‌دهنده">
              <ProviderBadge $color={sub.provider_color}>
                <Icon icon={sub.provider_icon || 'mdi:cloud'} style={{ fontSize: '1rem' }} />
                {sub.provider_name}
              </ProviderBadge>
            </Cell>

            <Cell data-label="تاریخ انقضا">
              {sub.expiry_date ? (
                <DateDisplay>
                  <div>{formatGregorianDate(sub.expiry_date)}</div>
                  <JalaliDate>{formatJalaliDateWithMonth(sub.expiry_date)}</JalaliDate>
                  <TimeDisplay>
                    UTC: {formatUTCTime(sub.expiry_date)} | Iran: {formatIranTime(sub.expiry_date)}
                  </TimeDisplay>
                  {sub.days_until_expiry !== null && (
                    <div style={{ fontSize: '0.7rem', color: sub.days_until_expiry <= 30 ? '#FF9800' : '#888' }}>
                      {sub.days_until_expiry > 0
                        ? `${sub.days_until_expiry} روز باقیمانده`
                        : `${Math.abs(sub.days_until_expiry)} روز پیش منقضی شده`}
                    </div>
                  )}
                </DateDisplay>
              ) : (
                <span style={{ color: '#666' }}>جاری</span>
              )}
            </Cell>

            <Cell data-label="وضعیت">
              <StatusBadge $status={status}>
                {status === 'active' ? 'فعال'
                  : status === 'expiring_soon' ? 'رو به انقضا'
                  : status === 'expired' ? 'منقضی'
                  : status === 'trial' ? 'آزمایشی'
                  : status === 'cancelled' ? 'لغو شده'
                  : status.replace('_', ' ')}
              </StatusBadge>
              {sub.billing_cycle && (
                <div style={{ marginTop: '4px' }}>
                  <BillingBadge>{sub.billing_cycle}</BillingBadge>
                </div>
              )}
            </Cell>

            <Cell data-label="تمدید خودکار / پرداخت">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <InfoBadge $active={sub.auto_renew}>
                  <Icon icon={sub.auto_renew ? 'mdi:autorenew' : 'mdi:close'} style={{ fontSize: '0.8rem' }} />
                  {sub.auto_renew ? 'تمدید خودکار' : 'دستی'}
                </InfoBadge>
                <InfoBadge $active={sub.has_active_payment_method}>
                  <Icon icon="mdi:credit-card" style={{ fontSize: '0.8rem' }} />
                  {sub.has_active_payment_method
                    ? (sub.payment_method || 'فعال')
                    : 'بدون پرداخت'}
                </InfoBadge>
              </div>
            </Cell>

            <Cell data-label="هزینه">
              {sub.renewal_cost ? (
                <CostDisplay>
                  <div>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: sub.renewal_currency || 'USD'
                    }).format(sub.renewal_cost)}
                    <span style={{ fontSize: '0.7rem', color: '#888' }}>/{sub.billing_cycle || 'mo'}</span>
                  </div>
                  {tomanAmount && <TomanCost>{formatToman(tomanAmount)}</TomanCost>}
                </CostDisplay>
              ) : (
                <span style={{ color: '#666' }}>رایگان</span>
              )}
            </Cell>

            <Cell data-label="عملیات">
              <DeleteButton onClick={() => onDelete(sub.id)}>
                <Icon icon="mdi:delete" style={{ fontSize: '1.2rem' }} />
              </DeleteButton>
            </Cell>
          </Row>
        );
      })}
    </Table>
  );
}
