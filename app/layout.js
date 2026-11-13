import './globals.css';
import { Fraunces, Inter } from 'next/font/google';

const display = Fraunces({ subsets: ['latin'], variable: '--font-display' });
const body = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata = { title: 'GyanDojo', description: 'Daily practice for SDET and DSA interviews' };
export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={display.variable + ' ' + body.variable}>
      <body><main>{children}</main></body>
    </html>
  );
}
