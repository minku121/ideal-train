'use client';

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { Loader } from "@/components/ui/loader";

interface DashboardAuthGuardProps {
  children: ReactNode;
}

export function DashboardAuthGuard({ children }: DashboardAuthGuardProps) {
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      // This will handle redirect to login if not authenticated
      window.location.href = "/login";
    },
  });

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

  return <>{children}</>;
}
