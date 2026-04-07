import "~/styles/globals.css";

import { type Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";

import { UserPreferencesProvider } from "~/contexts/user-preferences-context";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "ritmo",
  description: "habit tracker to build better routines",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('user-theme-preference');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <UserPreferencesProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </UserPreferencesProvider>
      </body>
    </html>
  );
}
