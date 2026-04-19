import "./globals.css";

import { Inter, Montserrat, Roboto } from "next/font/google";
import Script from "next/script";
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
        <Script src="//code.jivosite.com/widget/WPBvGc2oxZ" async></Script>
      </head>
      <body id="ab-market" className={`${inter.className} ${roboto.className} ${montserrat.className}`}>
        <AppGreenLine />
        <div>{children}</div>
      </body>
    </html>
  );
};

export default RootLayout;
