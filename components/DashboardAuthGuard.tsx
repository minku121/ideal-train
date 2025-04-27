'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  name?: string;
  email: string;
  role: string;
}

interface DashboardAuthGuardProps {
  children: (user: User) => React.ReactNode;
}

export function DashboardAuthGuard({ children }: DashboardAuthGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push("/login");
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null; // Redirecting, don't render anything
  }

  return <>{children(user)}</>;
}
