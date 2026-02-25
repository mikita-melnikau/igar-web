import {Metadata, ResolvingMetadata} from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {ContentResponse} from "@/app/types";
import {AppSafeContent} from "@/app/components/content";
import {AppHeader} from "@/app/components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type Props = {
    paramsPromise: Promise<{ id: string }>
    searchParams: string | URLSearchParams | string[][] | Record<string, string> | undefined
}

const fetchPageData= async (pathToFetch: string): Promise<ContentResponse>  => {
    const body = JSON.stringify({ path: pathToFetch });
    const options = { method: "PUT", body };
    const response = await fetch("http://localhost:3000/api/content", options);
    return response.json()
};

export async function generateMetadata(
    { paramsPromise, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    console.log("parse url!")
    const params = await paramsPromise;
    const pathname = params ? `/${Object.values(params).join('/')}` : "/";
    const queryString = new URLSearchParams(searchParams).toString();
    const fullUrl = `${pathname}${queryString ? '?' + queryString : ''}`;
    // const fullUrl = "/"
    const { meta, links } = await fetchPageData(fullUrl);
    return {
        title: meta.title,
        description: meta.description,
        keywords: meta.keywords,
    }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { content, links } = await fetchPageData("/");
  /*
    as={link.as}     // Опционально (для preload)
    crossOrigin={link.crossOrigin} // Опционально
    media={link.media} // Опционально
    sizes={link.sizes} // Опционально (для иконок)
   */

  return (
    <html lang="ru">
        <head>
            {links.map((link, index) => (
                <link
                    key={index}
                    rel={link.rel}
                    href={link.href}
                    type={link.type}
                />
            ))}
        </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppHeader />
        <main>
            <AppSafeContent html={content} />
        </main>
      </body>
    </html>
  );
}
