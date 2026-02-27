'use client';

import { useEffect } from 'react';
import ProviderDashboard from '@/components/ProviderDashboard';
import { Icon } from '@iconify-icon/react';
import Link from 'next/link';

export default function ProvidersPage() {
  useEffect(() => {
    // Initialize the database
    fetch('/api/init');
  }, []);

  return (
    <div className="app">
      <div className="app-header">
        <h1 className="app-title">Domain & Subscription Tracker</h1>
        <div className="header-actions">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button className="config-button" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon icon="mdi:arrow-left" />
              Subscriptions
            </button>
          </Link>
        </div>
      </div>
      <div className="content-container">
        <ProviderDashboard />
      </div>
    </div>
  );
}
