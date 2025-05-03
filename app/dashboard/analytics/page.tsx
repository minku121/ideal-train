"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user || session.user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [router, session, status]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Analytics</h1>
      <p>Platform analytics overview.</p>
    </div>
  );
}
