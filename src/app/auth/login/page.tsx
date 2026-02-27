'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@iconify-icon/react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleSSOLogin = async () => {
    setIsLoading(true);
    await signIn('orcest-sso', { callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}>در حال بارگذاری...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoSection}>
          <Icon icon="mdi:shield-lock" style={{ fontSize: '3rem', color: '#03DAC6' }} />
          <h1 style={styles.title}>سابکوریست</h1>
          <p style={styles.subtitle}>مدیریت اشتراک‌ها و دامنه‌های Orcest AI</p>
        </div>

        <div style={styles.divider} />

        <button
          onClick={handleSSOLogin}
          disabled={isLoading}
          style={{
            ...styles.ssoButton,
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          <Icon icon="mdi:login" style={{ fontSize: '1.3rem' }} />
          {isLoading ? 'در حال اتصال...' : 'ورود با حساب Orcest AI'}
        </button>

        <p style={styles.helpText}>
          از طریق سامانه ورود یکپارچه (SSO) وارد شوید
        </p>

        <div style={styles.infoBox}>
          <Icon icon="mdi:information-outline" style={{ fontSize: '1rem', color: '#03DAC6', flexShrink: 0 }} />
          <span>
            احراز هویت از طریق <strong>login.orcest.ai</strong> انجام می‌شود.
            اگر حساب کاربری ندارید، با مدیر سیستم تماس بگیرید.
          </span>
        </div>

        <div style={styles.footer}>
          <span style={styles.orgBadge}>subcorist</span>
          <span style={styles.footerText}>orcest.ai</span>
        </div>
      </div>
    </div>
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
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  logoSection: {
    textAlign: 'center' as const,
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.8rem',
    color: '#fff',
    margin: '0.75rem 0 0.25rem',
    fontWeight: 700,
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#999',
    margin: 0,
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(to left, transparent, #333, transparent)',
    margin: '1.5rem 0',
  },
  ssoButton: {
    width: '100%',
    padding: '0.9rem 1.2rem',
    background: '#03DAC6',
    color: '#080808',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
  },
  helpText: {
    textAlign: 'center' as const,
    color: '#666',
    fontSize: '0.8rem',
    margin: '0.75rem 0 1.5rem',
  },
  infoBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    padding: '0.75rem',
    background: 'rgba(3, 218, 198, 0.08)',
    borderRadius: '8px',
    fontSize: '0.8rem',
    color: '#999',
    lineHeight: 1.6,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #222',
  },
  orgBadge: {
    background: 'rgba(3, 218, 198, 0.15)',
    color: '#03DAC6',
    padding: '0.2rem 0.6rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  footerText: {
    color: '#666',
    fontSize: '0.75rem',
  },
  spinner: {
    textAlign: 'center' as const,
    color: '#999',
    padding: '2rem',
  },
};
