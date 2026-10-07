import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <Suspense fallback={<div className="h-96 w-80 animate-pulse bg-zinc-900 rounded-2xl" />}>
        <SignUp />
      </Suspense>
    </div>
  );
}
