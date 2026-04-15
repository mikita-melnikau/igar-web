import "./globals.css";

import { Montserrat, Roboto } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="ru">
      <head></head>
      <body className={`${montserrat.className} ${roboto.className}`} id="ab-market">
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
