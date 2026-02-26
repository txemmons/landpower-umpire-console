import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <h1>Landpower Umpire Console</h1>
          <nav className="card">
            <Link href="/setup">Setup</Link>
            <Link href="/turn">Turn</Link>
            <Link href="/units">Units</Link>
            <Link href="/actions/new?type=close_combat">New Close Combat Action</Link>
            <Link href="/log">Log</Link>
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}
