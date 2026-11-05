import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "SUHA Perfumes — Luxury Impressions | Karachi",
  description:
    "SUHA Perfumes crafts luxury impression fragrances for men and women. Discover 23 iconic scents in Petite 35ml and Grand 100ml. Karachi, Pakistan.",
  keywords: ["SUHA Perfumes", "perfume", "fragrance", "impressions", "Karachi", "luxury", "oud", "attar"],
  authors: [{ name: "SUHA Perfumes" }],
  icons: { icon: "/images/logo.png" },
  openGraph: {
    title: "SUHA Perfumes — Luxury Impressions",
    description: "Luxury impression fragrances. Petite 35ml & Grand 100ml. Karachi, Pakistan.",
    siteName: "SUHA Perfumes",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${cormorant.variable} ${jost.variable} antialiased bg-background text-foreground`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
