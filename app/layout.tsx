import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Chat Anywhere",
  description: "Chat with anyone in any room without an registration step.",
  icons: {
    icon: "/icon.png", // Define o ícone global
  },
  openGraph: {
    title: "Chat Anywhere",
    description: "Chat with anyone in any room without an registration step.",
    url: "https://chat-anywhere.vercel.app",
    siteName: "Chat Anywhere",
    images: ["/images/banner.png"],
  },
  twitter: {
    title: "Chat Anywhere",
    description: "Chat with anyone in any room without an registration step.",
    site: "https://chat-anywhere.vercel.app",
    card: "summary",
    images: ["/images/banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
