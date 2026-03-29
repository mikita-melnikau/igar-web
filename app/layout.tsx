import "./globals.css";
import { AppHeader } from "@/app/components/header";

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
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
