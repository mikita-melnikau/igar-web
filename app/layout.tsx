import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/app/components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /*
    as={link.as}     // Опционально (для preload)
    crossOrigin={link.crossOrigin} // Опционально
    media={link.media} // Опционально
    sizes={link.sizes} // Опционально (для иконок)
   */

  return (
    <html lang="ru" suppressHydrationWarning>
      <head></head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
