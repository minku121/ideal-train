"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SalesPage() {
  const router = useRouter();
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || '{}');
    if (!user || user.role !== "SELLER") {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Sales</h1>
      <p>View your sales statistics here.</p>
    </div>
  );
}
