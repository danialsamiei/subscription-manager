'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Icon } from '@iconify-icon/react';
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

  &:focus {
    border-color: #03DAC6;
    outline: none;
  }
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
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  background: ${props => {
    switch (props.$variant) {
      case 'primary': return '#03DAC6';
      case 'danger': return '#E94560';
      case 'test': return '#FF9800';
      default: return '#333';
    }
  }};
  color: ${props => props.$variant === 'primary' ? '#080808' : '#fff'};

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Section = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.75rem;
  font-size: 1rem;
  color: #03DAC6;
`;

const TestResult = styled.div<{ $success: boolean }>`
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  background: ${props => props.$success ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)'};
  color: ${props => props.$success ? '#4CAF50' : '#F44336'};
`;

const defaultLoginFields = [
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'password', label: 'Password', type: 'password' },
];

const defaultApiKeyFields = [
  { key: 'api_key', label: 'API Key', type: 'api_key' },
];

const credentialFields: Record<string, Array<{ key: string; label: string; type: string }>> = {
  // Domain & Infrastructure
  cloudflare: [
    { key: 'api_token', label: 'API Token', type: 'api_token' },
    { key: 'email', label: 'Email (for API Key auth)', type: 'email' },
    { key: 'api_key', label: 'Global API Key (optional)', type: 'api_key' },
  ],
  arvancloud: [{ key: 'api_key', label: 'API Key', type: 'api_key' }],
  nicir: [
    { key: 'username', label: 'NIC Handle / Username', type: 'email' },
    { key: 'password', label: 'Password', type: 'password' },
  ],
  namescom: [
    { key: 'username', label: 'Username', type: 'email' },
    { key: 'api_token', label: 'API Token', type: 'api_token' },
  ],
  digitalocean: [{ key: 'api_token', label: 'Personal Access Token', type: 'api_token' }],
  nsup: defaultLoginFields,
  spadserver: defaultLoginFields,

  // AI Development Platforms
  replit: [{ key: 'api_key', label: 'Session Cookie / API Key', type: 'api_key' }],
  boltnew: defaultLoginFields,
  rocketnew: defaultLoginFields,
  v0: defaultLoginFields,

  // AI API Providers
  openai: [{ key: 'api_key', label: 'OpenAI API Key', type: 'api_key' }],
  anthropic: [{ key: 'api_key', label: 'Anthropic API Key', type: 'api_key' }],
  deepseek: [{ key: 'api_key', label: 'DeepSeek API Key', type: 'api_key' }],
  google: [{ key: 'api_key', label: 'Gemini API Key', type: 'api_key' }],
  grok: [{ key: 'api_key', label: 'xAI / Grok API Key', type: 'api_key' }],
  perplexity: [{ key: 'api_key', label: 'Perplexity API Key', type: 'api_key' }],
  openrouter: [{ key: 'api_key', label: 'OpenRouter API Key', type: 'api_key' }],

  // Collaboration & Services
  github: [{ key: 'api_token', label: 'Personal Access Token (PAT)', type: 'api_token' }],
  googleworkspace: [
    { key: 'api_key', label: 'Service Account Key / API Key', type: 'api_key' },
    { key: 'email', label: 'Admin Email', type: 'email' },
  ],
  render: [{ key: 'api_key', label: 'Render API Key', type: 'api_key' }],
  slack: [{ key: 'api_key', label: 'Slack Bot Token', type: 'api_key' }],
  titanmail: defaultLoginFields,
};

interface Props {
  provider: Provider;
  onClose: () => void;
  onSave: () => void;
}

export default function ProviderConfigModal({ provider, onClose, onSave }: Props) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fields = credentialFields[provider.type] || [];

  const handleSaveCredentials = async () => {
    setIsSaving(true);
    try {
      for (const field of fields) {
        if (credentials[field.key]) {
          await fetch(`/api/providers/${provider.id}/credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              credential_type: field.type,
              credential_key: field.key,
              credential_value: credentials[field.key],
            }),
          });
        }
      }
      onSave();
    } catch (error) {
      console.error('Save credentials failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // Save credentials first
      for (const field of fields) {
        if (credentials[field.key]) {
          await fetch(`/api/providers/${provider.id}/credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              credential_type: field.type,
              credential_key: field.key,
              credential_value: credentials[field.key],
            }),
          });
        }
      }

      // Then test
      const response = await fetch(`/api/providers/${provider.id}/test`, {
        method: 'POST',
      });
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: 'Connection test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Title>
          <Icon icon={provider.icon || 'mdi:cloud'} style={{ color: provider.color, fontSize: '1.5rem' }} />
          {provider.name} Configuration
        </Title>

        <FormGroup>
          <Label>Provider Type</Label>
          <Input value={provider.type} disabled />
        </FormGroup>

        <FormGroup>
          <Label>Auth Method</Label>
          <Input value={provider.authMethod || (provider as any).auth_method || 'manual'} disabled />
        </FormGroup>

        <Section>
          <SectionTitle>Credentials</SectionTitle>
          {fields.map((field) => (
            <FormGroup key={field.key}>
              <Label>{field.label}</Label>
              <Input
                type={field.type === 'password' ? 'password' : 'text'}
                placeholder={`Enter ${field.label}`}
                value={credentials[field.key] || ''}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  [field.key]: e.target.value,
                }))}
              />
            </FormGroup>
          ))}

          {testResult && (
            <TestResult $success={testResult.success}>
              <Icon
                icon={testResult.success ? 'mdi:check-circle' : 'mdi:alert-circle'}
                style={{ marginRight: '0.5rem' }}
              />
              {testResult.message}
            </TestResult>
          )}
        </Section>

        <ButtonRow>
          <Button onClick={onClose}>Cancel</Button>
          <Button $variant="test" onClick={handleTest} disabled={isTesting}>
            <Icon icon="mdi:connection" />
            {isTesting ? 'Testing...' : 'Test'}
          </Button>
          <Button $variant="primary" onClick={handleSaveCredentials} disabled={isSaving}>
            <Icon icon="mdi:content-save" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </ButtonRow>
      </Modal>
    </Overlay>
  );
}
