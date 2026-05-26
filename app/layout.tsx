import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Qual é a sua personalidade de café? | Basecamp Coffee",
  description: "Descubra sua personalidade de café e a bebida perfeita para você.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} h-full`}>
      <body className="min-h-full flex flex-col font-nunito">{children}</body>
    </html>
  );
}
