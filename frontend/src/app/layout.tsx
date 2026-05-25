import type { Metadata } from 'next';
import { Playfair_Display, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import { UserProvider } from '@/context/UserContext';
import { ToastProvider } from '@/context/ToastContext';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const sourceSerif = Source_Serif_4({ subsets: ['latin'], variable: '--font-source-serif' });

export const metadata: Metadata = {
  title: 'VedaAI',
  description: 'AI Assessment Creator for modern classrooms',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${sourceSerif.variable} bg-white text-slate-900 antialiased`}>
        <UserProvider>
          <ToastProvider>{children}</ToastProvider>
        </UserProvider>
      </body>
    </html>
  );
}