import { Suspense } from "react";

import { AuthForm } from "@/components/auth";

function AuthFormFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <p className="text-sm text-muted-foreground">Loading sign-in…</p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthFormFallback />}>
      <AuthForm />
    </Suspense>
  );
}
