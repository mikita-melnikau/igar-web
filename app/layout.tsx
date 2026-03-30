import { AppHeader } from "@/app/components/header";
import { HeaderOffset } from "./components/HeaderOffset";
import "./globals.css";

const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="ru">
      <head></head>
      <body>
        <AppHeader />
        <HeaderOffset />
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
