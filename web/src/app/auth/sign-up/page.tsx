import { Suspense } from "react";
import SignUpForm from "./SignUpForm";

export default function SignUpPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading…</p>}>
      <SignUpForm />
    </Suspense>
  );
}
