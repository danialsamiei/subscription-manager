'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Provider } from '@/types';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const Modal = styled(motion.div)`
  background: #1a1a1a;
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  max-height: 85vh;
  overflow-y: auto;
  border: 1px solid #333;
`;

const Title = styled.h2`
  margin: 0 0 1.5rem;
  color: #fff;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 0.25rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.6rem 0.8rem;
  background: #2c2c2c;
  border: 1px solid #444;
  border-radius: 8px;
  color: #fff;
  font-size: 0.9rem;
  &:focus { border-color: #03DAC6; outline: none; }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.6rem 0.8rem;
  background: #2c2c2c;
  border: 1px solid #444;
  border-radius: 8px;
  color: #fff;
  font-size: 0.9rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ddd;
  font-size: 0.9rem;
  cursor: pointer;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const Button = styled.button<{ $variant?: string }>`
  flex: 1;
  padding: 0.7rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  background: ${props => props.$variant === 'primary' ? '#03DAC6' : '#333'};
  color: ${props => props.$variant === 'primary' ? '#080808' : '#fff'};
  &:hover { opacity: 0.9; }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

interface Props {
  providers: Provider[];
  onClose: () => void;
  onSave: () => void;
}

export default function AddServiceSubModal({ providers, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    provider_id: providers[0]?.id || '',
    service_name: '',
    plan_name: '',
    status: 'active',
    start_date: '',
    expiry_date: '',
    auto_renew: false,
    renewal_cost: '',
    renewal_currency: 'USD',
    billing_cycle: 'monthly',
    payment_method: '',
    has_active_payment_method: false,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/service-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          renewal_cost: form.renewal_cost ? parseFloat(form.renewal_cost) : null,
        }),
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to add subscription:', error);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
        <Title>Add Service Subscription</Title>
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Provider</Label>
            <Select value={form.provider_id} onChange={e => setForm({ ...form, provider_id: e.target.value })}>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Service Name *</Label>
            <Input
              required
              placeholder="e.g., Cloudflare Pro, DigitalOcean Droplet"
              value={form.service_name}
              onChange={e => setForm({ ...form, service_name: e.target.value })}
            />
          </FormGroup>

          <Row>
            <FormGroup>
              <Label>Plan Name</Label>
              <Input
                placeholder="e.g., Pro, Business"
                value={form.plan_name}
                onChange={e => setForm({ ...form, plan_name: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label>Status</Label>
              <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="expiring_soon">Expiring Soon</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
                <option value="paused">Paused</option>
                <option value="unknown">Unknown</option>
              </Select>
            </FormGroup>
          </Row>

          <Row>
            <FormGroup>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={form.expiry_date}
                onChange={e => setForm({ ...form, expiry_date: e.target.value })}
              />
            </FormGroup>
          </Row>

          <Row>
            <FormGroup>
              <Label>Renewal Cost</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="19.99"
                value={form.renewal_cost}
                onChange={e => setForm({ ...form, renewal_cost: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label>Currency</Label>
              <Select value={form.renewal_currency} onChange={e => setForm({ ...form, renewal_currency: e.target.value })}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="IRR">IRR (Rial)</option>
                <option value="AED">AED</option>
                <option value="TRY">TRY</option>
              </Select>
            </FormGroup>
          </Row>

          <FormGroup>
            <Label>Billing Cycle</Label>
            <Select value={form.billing_cycle} onChange={e => setForm({ ...form, billing_cycle: e.target.value })}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="weekly">Weekly</option>
              <option value="one_time">One-time</option>
              <option value="custom">Custom</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Payment Method</Label>
            <Input
              placeholder="e.g., Mastercard ending 1234"
              value={form.payment_method}
              onChange={e => setForm({ ...form, payment_method: e.target.value })}
            />
          </FormGroup>

          <Row>
            <FormGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={form.auto_renew}
                  onChange={e => setForm({ ...form, auto_renew: e.target.checked })}
                />
                Auto-Renew
              </CheckboxLabel>
            </FormGroup>
            <FormGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={form.has_active_payment_method}
                  onChange={e => setForm({ ...form, has_active_payment_method: e.target.checked })}
                />
                Active Payment Method
              </CheckboxLabel>
            </FormGroup>
          </Row>

          <FormGroup>
            <Label>Notes</Label>
            <Input
              placeholder="Optional notes..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </FormGroup>

          <ButtonRow>
            <Button type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" $variant="primary">Add Subscription</Button>
          </ButtonRow>
        </form>
      </Modal>
    </Overlay>
  );
}
