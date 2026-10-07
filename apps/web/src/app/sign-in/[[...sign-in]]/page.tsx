import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <Suspense fallback={<div className="h-96 w-80 animate-pulse bg-zinc-900 rounded-2xl" />}>
        <SignIn />
      </Suspense>
    </div>
  );
}
