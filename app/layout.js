import './globals.css';

export const metadata = { title: 'GyanDojo', description: 'Daily practice for SDET and DSA interviews' };
export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><main>{children}</main></body>
    </html>
  );
}
