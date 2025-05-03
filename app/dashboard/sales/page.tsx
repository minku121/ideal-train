"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SalesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user || session.user.role !== "SELLER") {
      router.replace("/dashboard");
    }
  }, [router, session, status]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Sales</h1>
      <p>View your sales statistics here.</p>
    </div>
  );
}
