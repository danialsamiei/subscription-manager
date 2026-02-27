'use client';

import { useEffect } from 'react';
import ProviderDashboard from '@/components/ProviderDashboard';
import { Icon } from '@iconify-icon/react';
import UserBar from '@/components/UserBar';
import Link from 'next/link';

export default function ProvidersPage() {
  useEffect(() => {
    // Initialize the database
    fetch('/api/init');
  }, []);

  return (
    <div className="app">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
        <span style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' }}>subcorist — orcest.ai</span>
        <UserBar />
      </div>
      <div className="app-header">
        <h1 className="app-title">ردیاب دامنه‌ها و اشتراک‌ها</h1>
        <div className="header-actions">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button className="config-button" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon icon="mdi:arrow-right" />
              اشتراک‌ها
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
