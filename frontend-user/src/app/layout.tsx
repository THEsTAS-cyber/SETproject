import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./AuthProvider";
import AuthNav from "./AuthNav";
import NanobotWidget from "@/components/NanobotWidget";

export const metadata: Metadata = {
  title: "ProjectSET — PS Store Prices",
  description: "Сравнение цен игр в PS Store по регионам",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          <header className="header">
            <nav className="nav-content">
              <div className="nav-left">
                <a href="/games" className="nav-logo">🎮 PS Prices</a>
              </div>
              <div className="nav-links">
                <a href="/games" className="nav-link">Каталог</a>
                <a href="/favorites" className="nav-link">Избранное</a>
              </div>
              <div className="nav-right">
                <AuthNav />
              </div>
            </nav>
          </header>
          <main>{children}</main>
          <NanobotWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
