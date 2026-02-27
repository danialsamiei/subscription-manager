'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import SubscriptionList from '@/components/SubscriptionList';
import SubscriptionModal from '@/components/SubscriptionModal';
import CalendarGrid from '@/components/CalendarGrid';
import Totals from '@/components/Totals';
import { Subscription, UserConfiguration, NtfySettings } from '@/types';
import { Icon } from '@iconify-icon/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import ConfigurationModal from '@/components/ConfigurationModal';
import CostTrendGraph from '@/components/CostTrendGraph';
import CompositionCharts from '@/components/CompositionCharts';
import UserBar from '@/components/UserBar';
import Link from 'next/link';

export default function Home() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [userConfig, setUserConfig] = useState<UserConfiguration>({
    currency: 'USD',
    showCurrencySymbol: true,
  });
  const [ntfySettings, setNtfySettings] = useState<NtfySettings>({
    topic: '',
    domain: 'https://ntfy.sh',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[] | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize the database
        await fetch('/api/init');

        // Fetch initial data
        const [subs, config, ntfy] = await Promise.all([
          fetch('/api/subscriptions').then(res => res.json()),
          fetch('/api/user-configuration').then(res => res.json()),
          fetch('/api/ntfy-settings').then(res => res.json()),
        ]);

        // Initialize included field if not present
        const updatedSubs = subs.map((sub: Subscription) => ({
          ...sub,
          included: sub.included !== undefined ? sub.included : true,
          interval_value: sub.intervalValue?.toString() || '1',
          interval_unit: sub.intervalUnit || 'months'
        }));

        setSubscriptions(updatedSubs);
        setUserConfig(config);
        setNtfySettings(ntfy);
      } catch (error) {
        console.error('Error initializing app:', error);
        alert('خطا در بارگذاری برنامه. لطفا صفحه را رفرش کنید.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleSaveSubscription = async (subscription: Subscription) => {
    try {
      const method = subscription.id ? 'PUT' : 'POST';
      const url = subscription.id
        ? `/api/subscriptions/${subscription.id}`
        : '/api/subscriptions';

      // Add included property if not present
      const subToSave = {
        ...subscription,
        included: subscription.included !== undefined ? subscription.included : true
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subToSave),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      const updatedSubscription = await response.json();
      // Ensure the included property exists on the returned subscription
      const finalSub = {
        ...updatedSubscription,
        included: updatedSubscription.included !== undefined ? updatedSubscription.included : true
      };

      setSubscriptions(prev =>
        subscription.id
          ? prev.map(sub => (sub.id === subscription.id ? finalSub : sub))
          : [...prev, finalSub]
      );
    } catch (error) {
      console.error('Error saving subscription:', error);
      alert('خطا در ذخیره اشتراک. لطفا دوباره تلاش کنید.');
    }
  };

  const handleDeleteSubscription = async (id: number) => {
    if (!confirm('آیا از حذف این اشتراک مطمئن هستید؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete subscription');
      }

      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
    } catch (error) {
      console.error('Error deleting subscription:', error);
      alert('خطا در حذف اشتراک. لطفا دوباره تلاش کنید.');
    }
  };

  const handleToggleInclude = (id: number) => {
    setSubscriptions(prev =>
      prev.map(sub =>
        sub.id === id ? { ...sub, included: !sub.included } : sub
      )
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedSubscription(undefined);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const data = JSON.stringify(subscriptions, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscriptions.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedSubscriptions = JSON.parse(e.target?.result as string);
        console.log("Imported data:", importedSubscriptions);

        // First update the UI state
        setSubscriptions(importedSubscriptions);

        // Then save each subscription to the database
        const savePromises = importedSubscriptions.map(async (sub: any) => {
          // Copy dates explicitly
          const dueDate = sub.dueDate || sub.due_date;

          // Prepare subscription with proper types
          const newSub = {
            name: sub.name,
            amount: Number(sub.amount),
            due_date: sub.due_date,
            dueDate: dueDate,
            icon: sub.icon || "",
            color: sub.color || "",
            account: sub.account || "",
            autopay: Boolean(sub.autopay),
            interval_value: Number(sub.interval_value || 1),
            interval_unit: sub.interval_unit || "months",
            intervalValue: Number(sub.interval_value || sub.intervalValue || 1),
            intervalUnit: sub.intervalUnit || sub.interval_unit || "months",
            notify: Boolean(sub.notify),
            currency: sub.currency || userConfig.currency,
            tags: Array.isArray(sub.tags) ? sub.tags : [],
            included: sub.included !== undefined ? Boolean(sub.included) : true
          };

          console.log("Saving subscription with due date:", newSub.due_date);

          const response = await fetch('/api/subscriptions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newSub),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`API error: ${errorText}`);
            throw new Error(`Failed to save subscription: ${sub.name}`);
          }

          const savedSub = await response.json();
          console.log("Saved subscription:", savedSub);
          return savedSub;
        });

        try {
          // Wait for all subscriptions to be saved
          const savedSubscriptions = await Promise.all(savePromises);

          // Update the state with the saved subscriptions that now have database IDs
          setSubscriptions(savedSubscriptions);

          alert(`${savedSubscriptions.length} اشتراک با موفقیت وارد شد.`);
        } catch (error) {
          console.error('Error in Promise.all:', error);
          alert('برخی اشتراک‌ها وارد نشدند. کنسول را بررسی کنید.');
        }
      } catch (error) {
        console.error('Error importing subscriptions:', error);
        alert('خطا در وارد کردن اشتراک‌ها. فرمت فایل را بررسی کنید.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfigurationSave = async (config: {
    currency: string;
    ntfyTopic: string;
    ntfyDomain: string;
    showCurrencySymbol: boolean;
  }) => {
    try {
      // Save currency and showCurrencySymbol
      await fetch('/api/user-configuration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: config.currency,
          showCurrencySymbol: config.showCurrencySymbol
        })
      });

      // Save ntfy settings
      await fetch('/api/ntfy-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: config.ntfyTopic,
          domain: config.ntfyDomain
        })
      });

      // Update local state
      setUserConfig({
        currency: config.currency,
        showCurrencySymbol: config.showCurrencySymbol
      });

      setNtfySettings({
        topic: config.ntfyTopic,
        domain: config.ntfyDomain
      });

      setIsConfigModalOpen(false);
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('خطا در ذخیره تنظیمات. لطفا دوباره تلاش کنید.');
    }
  };

  if (isLoading) {
    return (
      <div className="app">
        <Header />
        <div className="content-container">
          <div style={{ textAlign: 'center', marginTop: '2rem', color: '#fff' }}>
            در حال بارگذاری...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
        <span style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' }}>subcorist — orcest.ai</span>
        <UserBar />
      </div>
      <div className="app-header">
        <h1 className="app-title">مدیریت اشتراک‌ها</h1>
        <div className="header-actions">
          {/* دکمه خروجی */}
          <button className="export-button" onClick={handleExport} data-label="خروجی">
            <Icon icon="mdi:download" className="export-icon" />
          </button>

          {/* دکمه ورودی */}
          <label className="import-button" data-label="ورودی">
            <Icon icon="mdi:upload" className="import-icon" />
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="import-input"
            />
          </label>

          {/* دکمه ردیاب دامنه و سرویس */}
          <Link href="/providers" style={{ textDecoration: 'none' }}>
            <button className="config-button" data-label="دامنه‌ها" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon icon="mdi:earth" />
              دامنه‌ها و سرویس‌ها
            </button>
          </Link>

          {/* دکمه تنظیمات */}
          <button
            className="config-button"
            onClick={() => setIsConfigModalOpen(true)}
            data-label="تنظیمات"
          >
            <FontAwesomeIcon icon={faCog} />
          </button>
        </div>
      </div>
      <div className="content-container">
        <CalendarGrid
          subscriptions={subscriptions}
          onDateClick={handleDateClick}
          currentDate={selectedDate}
        />
        <SubscriptionList
          subscriptions={subscriptions}
          onEdit={(subscription) => {
            setSelectedSubscription(subscription);
            setIsModalOpen(true);
          }}
          onDelete={handleDeleteSubscription}
          onToggleInclude={handleToggleInclude}
          showCurrencySymbol={userConfig.showCurrencySymbol}
          onFilteredSubscriptionsChange={(filteredSubs) => setFilteredSubscriptions(filteredSubs)}
          onTagFilterChange={(tags) => setSelectedTags(tags)}
        />
        <Totals
          subscriptions={filteredSubscriptions || subscriptions}
          currency={userConfig.currency}
          showCurrencySymbol={userConfig.showCurrencySymbol}
          selectedTags={selectedTags}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
        <CostTrendGraph
          subscriptions={filteredSubscriptions || subscriptions}
          selectedPeriod={selectedPeriod}
          currency={userConfig.currency}
          showCurrencySymbol={userConfig.showCurrencySymbol}
        />
        <CompositionCharts
          subscriptions={filteredSubscriptions || subscriptions}
          currency={userConfig.currency}
        />
      </div>
      {isModalOpen && (
        <SubscriptionModal
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSubscription(undefined);
          }}
          onSave={handleSaveSubscription}
          selectedSubscription={selectedSubscription}
          selectedDate={selectedDate}
          defaultCurrency={userConfig.currency}
        />
      )}

      {isConfigModalOpen && (
        <ConfigurationModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          currency={userConfig.currency}
          showCurrencySymbol={userConfig.showCurrencySymbol}
          ntfyTopic={ntfySettings.topic || ''}
          ntfyDomain={ntfySettings.domain || 'https://ntfy.sh'}
          onSave={handleConfigurationSave}
        />
      )}
    </div>
  );
} 