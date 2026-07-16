import { AppearanceSettings, OnboardingSettings } from "@/components/settings";
import { MainLayout } from "@/components/layout";

export default function SettingsPage() {
  return (
    <MainLayout subtitle="Settings">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your workspace preferences and appearance.
          </p>
        </div>
        <AppearanceSettings />
        <div className="mt-6">
          <OnboardingSettings />
        </div>
      </div>
    </MainLayout>
  );
}
