import { ProfilePageContent } from "@/components/profile";
import { MainLayout } from "@/components/layout";

export default function ProfilePage() {
  return (
    <MainLayout subtitle="Profile">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your display name, GitHub handle, and avatar.
          </p>
        </div>
        <ProfilePageContent />
      </div>
    </MainLayout>
  );
}
