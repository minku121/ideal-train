"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || '{}');
    if (!user) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <p>Update your settings here.</p>
    </div>
  );
}
