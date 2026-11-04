import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com"),
  title: {
    default: "Green Pastures Technology Group",
    template: "%s | Green Pastures Technology Group",
  },
  description: "Green Pastures Technology Group — technology services for your business.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="brand">
              Green Pastures Technology Group
            </Link>
            <nav>
              <Link href="/">About</Link>
              <Link href="/contact">Contact us</Link>
            </nav>
          </div>
        </header>

        <main className="container">{children}</main>

        <footer className="site-footer">
          <div className="container">
            <p>© {new Date().getFullYear()} Green Pastures Technology Group. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
