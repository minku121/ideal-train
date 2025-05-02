"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
  const router = useRouter();
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || '{}');
    if (!user || user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Analytics</h1>
      <p>Platform analytics overview.</p>
    </div>
  );
}
