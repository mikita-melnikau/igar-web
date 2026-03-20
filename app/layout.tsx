import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata, ResolvingMetadata } from "next";
import "./globals.css";
import { AppHeader } from "@/app/components/header";
import { fetchPageData } from "@/app/lib/page-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const sp = await searchParams;
  const pathname = "/";

  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(sp || {})) {
    if (typeof value === "string") {
      filtered[key] = value;
    } else if (Array.isArray(value)) {
      filtered[key] = value.join(",");
    }
  }

  const queryString = new URLSearchParams(filtered).toString();
  const fullUrl = `${pathname}${queryString ? "?" + queryString : ""}`;

  const { meta } = await fetchPageData(fullUrl);

  return {
    title: meta?.title,
    description: meta?.description,
    keywords: meta?.keywords,
  };
}

const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="ru">
      <head></head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppHeader />
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
