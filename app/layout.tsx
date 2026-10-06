import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { site } from "@/lib/config";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });

const title = `Meet with ${site.owner.name}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: `%s · ${title}` },
  description: site.owner.intro,
  openGraph: { title, description: site.owner.intro, url: site.url, type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f4f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1116" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} font-sans antialiased`}>
        <main className="flex min-h-dvh justify-center px-0 py-0 sm:px-6 sm:py-16">{children}</main>
      </body>
    </html>
  );
}
