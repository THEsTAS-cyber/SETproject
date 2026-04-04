import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProjectSET — Admin Panel",
  description: "Admin dashboard for ProjectSET",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <nav>
            <a href="/">Dashboard</a>
            <a href="/users">Users</a>
            <a href="/analytics">Analytics</a>
            <a href="/settings">Settings</a>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
