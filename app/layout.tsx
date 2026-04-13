import "./globals.css";

const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="ru">
      <head></head>
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
