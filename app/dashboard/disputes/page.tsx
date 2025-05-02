"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DisputesPage() {
  const router = useRouter();
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || '{}');
    if (!user || user.role !== "MEDIATOR") {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Disputes</h1>
      <p>Manage disputes here.</p>
    </div>
  );
}
