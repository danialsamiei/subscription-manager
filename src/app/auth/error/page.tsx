'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify-icon/react';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    Configuration: 'تنظیمات سرور احراز هویت نادرست است. لطفا با مدیر سیستم تماس بگیرید.',
    AccessDenied: 'دسترسی شما به این سرویس مجاز نیست.',
    Verification: 'لینک تایید منقضی شده یا قبلا استفاده شده است.',
    OAuthSignin: 'خطا در شروع فرایند ورود. لطفا دوباره تلاش کنید.',
    OAuthCallback: 'خطا در پردازش پاسخ SSO. لطفا دوباره تلاش کنید.',
    OAuthCreateAccount: 'امکان ایجاد حساب کاربری وجود ندارد. با مدیر سیستم تماس بگیرید.',
    Callback: 'خطا در بازگشت از سامانه احراز هویت.',
    Default: 'خطایی در فرایند ورود رخ داده است. لطفا دوباره تلاش کنید.',
  };

  const message = error ? (errorMessages[error] || errorMessages.Default) : errorMessages.Default;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Icon icon="mdi:alert-circle" style={{ fontSize: '3rem', color: '#E94560' }} />
        <h1 style={styles.title}>خطا در احراز هویت</h1>
        <p style={styles.message}>{message}</p>
        {error && (
          <p style={styles.errorCode}>کد خطا: {error}</p>
        )}
        <Link href="/auth/login" style={styles.link}>
          <Icon icon="mdi:arrow-right" />
          بازگشت به صفحه ورود
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ color: '#999', textAlign: 'center' }}>در حال بارگذاری...</p>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    direction: 'rtl',
  },
  card: {
    background: '#1a1a1a',
    borderRadius: '16px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '420px',
    border: '1px solid #333',
    textAlign: 'center' as const,
  },
  title: {
    fontSize: '1.4rem',
    color: '#E94560',
    margin: '1rem 0 0.75rem',
  },
  message: {
    color: '#ccc',
    fontSize: '0.9rem',
    lineHeight: 1.7,
    margin: '0 0 1rem',
  },
  errorCode: {
    color: '#666',
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    margin: '0 0 1.5rem',
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#03DAC6',
    textDecoration: 'none',
    fontSize: '0.9rem',
    padding: '0.6rem 1.2rem',
    border: '1px solid #03DAC6',
    borderRadius: '8px',
    transition: 'all 0.3s',
  },
};
