import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { GameSessionProvider } from "@/context/GameSessionContext";
import { ActiveMatchProvider } from "@/context/ActiveMatchContext";

export const metadata: Metadata = {
  title: "マチジカン！- 待ち時間対戦ゲームマスター",
  description: "テーマパークや待ち時間に、1台のスマホを囲んで道具なしで対戦できるゲームマスターWebアプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GameSessionProvider>
          <ActiveMatchProvider>{children}</ActiveMatchProvider>
        </GameSessionProvider>
      </body>
    </html>
  );
}
