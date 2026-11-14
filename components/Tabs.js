'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [['/', 'Battles'], ['/review', 'Review'], ['/starred', 'Starred']];

export default function Tabs() {
  const p = usePathname() || '/';
  const active = href => (href === '/' ? p === '/' || p.startsWith('/battle') : p.startsWith(href));
  return (
    <nav className="tabbar">
      {items.map(([href, label]) => (
        <Link key={href} href={href} className={active(href) ? 'on' : ''}>{label}</Link>
      ))}
    </nav>
  );
}
