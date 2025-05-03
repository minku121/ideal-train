"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { BarChart3, Package, ShoppingCart, Users } from "lucide-react"

import AdminDashboard from "@/components/AdminDashboard";
import BuyerDashboard from "@/components/BuyerDashboard";
import SellerDashboard from "@/components/SellerDashboard";
import MediatorDashboard from "@/components/MediatorDashboard";
import { Loader } from "@/components/ui/loader";

interface User {
  name?: string;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);
  const [data, setData] = useState({});
  
  useEffect(() => {
    setIsClient(true);
    
    // Only fetch dashboard data if we have a session
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log('Dashboard data:', data);
      setData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  if (!isClient || status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (!session?.user) {
    return null; // Let the layout handle the redirect
  }

  const user = {
    name: session.user.name || undefined,
    email: session.user.email || '',
    role: session.user.role || ''
  };

  console.log("DashboardPage user role:", user.role);

  switch (user.role) {
    case "ADMIN":
      return <AdminDashboard user={user} data={data} />;
    case "BUYER":
      return <BuyerDashboard user={user} data={data} />;
    case "SELLER":
      return <SellerDashboard user={user} />;
    case "MEDIATOR":
      return <MediatorDashboard user={user} />;
    default:
      return <div>Unauthorized: Your role does not have access to the dashboard.</div>;
  }
}
