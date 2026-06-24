import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dottd — Share a link. Get birthdays on your calendar.",
  description:
    "Send your Dottd link to anyone. They fill a tiny form and their birthday lands on your calendar automatically.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
