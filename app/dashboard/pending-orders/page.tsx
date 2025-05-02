"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader } from "@/components/ui/loader";

export default function PendingOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || '{}');
      setUser(userObj);
      if (!userObj || userObj.role !== "BUYER") {
        router.replace("/dashboard");
        return;
      }
      // Here you would fetch pending orders data
      // For now we'll just simulate loading
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error loading user data:", error);
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
          Pending Orders
        </h1>
        <Loader text="Loading pending orders..." size="md" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold mb-4 text-gray-800 dark:text-white">Pending Orders</h1>
      <p className="text-gray-600 dark:text-gray-300">All your pending orders will be shown here.</p>
      
      {/* Pending orders content would go here */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center"
      >
        <p className="text-gray-500 dark:text-gray-300 text-lg">
          You don't have any pending orders at the moment.
        </p>
      </motion.div>
    </div>
  );
}
