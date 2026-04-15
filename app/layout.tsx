import "./globals.css";

import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700", "900"],
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
      <body id="ab-market" className={`${montserrat.className}`}>
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
