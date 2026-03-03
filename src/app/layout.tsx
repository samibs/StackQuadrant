import type { Metadata } from "next";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/ui/command-palette";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";
import { Footer } from "@/components/layout/footer";
import { OurProjectsBadge } from "@/components/layout/our-projects-badge";
import { AskWidget } from "@/components/widget/ask-widget";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stackquadrant.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "StackQuadrant — AI Developer Tool Intelligence",
    template: "%s — StackQuadrant",
  },
  description: "Data-driven evaluations of AI coding tools, stacks, and workflows. Compare 15+ tools across 6 dimensions with real benchmarks.",
  keywords: ["AI coding tools", "developer tools", "code generation", "AI benchmarks", "Gartner alternative", "tool comparison", "developer intelligence"],
  authors: [{ name: "StackQuadrant" }],
  creator: "StackQuadrant",
  openGraph: {
    title: "StackQuadrant — AI Developer Tool Intelligence",
    description: "Data-driven evaluations of AI coding tools, stacks, and workflows. Compare 15+ tools across 6 dimensions.",
    url: BASE_URL,
    siteName: "StackQuadrant",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StackQuadrant — AI Developer Tool Intelligence",
    description: "Data-driven evaluations of AI coding tools, stacks, and workflows.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  icons: {
    icon: "/favicon.svg",
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0a0f0a" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('sq-theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                  var meta = document.querySelector('meta[name="theme-color"]');
                  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a0f0a' : '#f8f9fa');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <ThemeProvider>
          <Header />
          <CommandPalette />
          <main style={{ paddingTop: "var(--header-height)", minHeight: "calc(100vh - var(--header-height))" }}>
            {children}
          </main>
          <Footer />
          <OurProjectsBadge />
          <AskWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
