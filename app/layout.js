import "./globals.css";

export const metadata = {
  title: "Hourglass Desk",
  description: "A quiet public desk. Features turn over with the hour.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,560;8..60,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
