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

export const metadata: Metadata = {
  title: "StackQuadrant — AI Developer Tool Intelligence",
  description: "Data-driven evaluations of AI coding tools, stacks, and workflows. The developer intelligence platform.",
  openGraph: {
    title: "StackQuadrant — AI Developer Tool Intelligence",
    description: "Data-driven evaluations of AI coding tools, stacks, and workflows.",
    type: "website",
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
        <ThemeProvider>
          <Header />
          <CommandPalette />
          <main style={{ paddingTop: "var(--header-height)", minHeight: "calc(100vh - var(--header-height))" }}>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
