"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-secondary px-3 py-1.5 text-xs">
      Sign out
    </button>
  );
}
