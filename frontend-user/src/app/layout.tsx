import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./AuthProvider";
import AuthNav from "./AuthNav";
import NanobotWidget from "@/components/NanobotWidget";

export const metadata: Metadata = {
  title: "ProjectSET — User Panel",
  description: "User dashboard for ProjectSET",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <header className="header">
            <nav>
              <a href="/">Home</a>
              <a href="/games">Games</a>
              <a href="/favorites">Избранное</a>
              <AuthNav />
            </nav>
          </header>
          <main>{children}</main>
          <NanobotWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
