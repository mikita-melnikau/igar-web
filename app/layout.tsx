import "./globals.css";

import { Montserrat, Roboto, Inter } from "next/font/google";
import { AppGreenLine } from "@/src/components/AppGreenLine";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  variable: "--font-montserrat",
});

const roboto = Roboto({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-roboto",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="ru">
      <head>
        <link rel="stylesheet" href="/ab-market/partners.bundle.css" />
      </head>
      <body id="ab-market" className={`${inter.className} ${roboto.className} ${montserrat.className}`}>
        <AppGreenLine />
        <div>{children}</div>
      </body>
    </html>
  );
};

export default RootLayout;
