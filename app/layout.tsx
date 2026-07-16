import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { OnboardingProvider } from "@/components/onboarding";
import { CelebrationProvider } from "@/components/celebration";
import { ThemeProvider } from "@/components/theme";
import { BreakZoneProvider } from "@/components/break-zone";
import { KizunaReminderProvider, KizunaChatProvider } from "@/components/kizuna";
import { WellnessProvider } from "@/components/wellness";
import { WorkspaceProvider } from "@/components/workspace";
import { CommentsProvider } from "@/components/comments";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} — AI-Powered Project Management`,
  description:
    "Anovia helps teams stay productive, motivated, and balanced with intelligent project management powered by Kizuna AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-theme="light"
      data-theme-mode="system"
      data-color-preset="anovia"
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans" suppressHydrationWarning>
        <ThemeProvider>
          <OnboardingProvider>
            <CelebrationProvider>
              <WorkspaceProvider>
                <CommentsProvider>
                  <WellnessProvider>
                    <KizunaReminderProvider>
                      <KizunaChatProvider>
                        <BreakZoneProvider>{children}</BreakZoneProvider>
                      </KizunaChatProvider>
                    </KizunaReminderProvider>
                  </WellnessProvider>
                </CommentsProvider>
              </WorkspaceProvider>
            </CelebrationProvider>
          </OnboardingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
