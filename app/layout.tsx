import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { APP_NAME } from "@/lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_DESCRIPTION =
  "Cole a cifra, transponha pro tom da sua equipe e exporte um PDF A4 pronto pra folha do culto.";

// `||` e nao `??`: um build em container recebe a variavel como string vazia
// quando o ARG nao e passado, e "" passaria pelo `??` direto para
// new URL(""), que lanca ERR_INVALID_URL e derruba o build inteiro.
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(appUrl),
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: appUrl,
    siteName: APP_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
