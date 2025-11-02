import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/lib/providers';
import { UserProvider } from '@/lib/user-context';
import { AppLayout } from '@/components/app-layout';

export const metadata: Metadata = {
  title: 'AMPD',
  description: 'AMPD Application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className='antialiased'>
        <Providers>
          <UserProvider>
            <AppLayout>{children}</AppLayout>
          </UserProvider>
        </Providers>
      </body>
    </html>
  );
}
