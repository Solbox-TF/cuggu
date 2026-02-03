import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cuggu - AI 웨딩 청첩장",
  description: "AI로 만드는 특별한 모바일 청첩장",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
