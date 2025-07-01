"use client";

import authClient from "@/lib/auth";
import { type ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
