"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => signIn()}
    >
      Sign In
    </Button>
  );
}
