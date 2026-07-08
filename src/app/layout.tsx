import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeMatade Algo Operations Panel",
  description: "Business operations panel for DeMatade Algo Technology Solutions Pvt Ltd",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
