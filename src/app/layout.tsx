import type { Metadata } from 'next';
import { Poppins, Montserrat } from 'next/font/google';
import StyledComponentsRegistry from '@/lib/registry';
import SessionProvider from '@/lib/SessionProvider';
import './globals.css';

const poppins = Poppins({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

const montserrat = Montserrat({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'مدیریت اشتراک‌ها و دامنه‌ها',
  description: 'سابکوریست - مدیریت یکپارچه اشتراک‌ها، دامنه‌ها و سرویس‌های ابری Orcest AI',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/logo192.png' },
    ],
    other: [
      {
        rel: 'apple-touch-icon',
        url: '/logo192.png',
      },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/logo192.png" />
      </head>
      <body className={`${poppins.variable} ${montserrat.variable}`}>
        <SessionProvider session={null}>
          <StyledComponentsRegistry>
            {children}
          </StyledComponentsRegistry>
        </SessionProvider>
      </body>
    </html>
  );
} 