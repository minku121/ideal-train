"use client"

import { useEffect, useState } from "react"
import { BarChart3, Package, ShoppingCart, Users } from "lucide-react"
import { getSession } from "next-auth/react"

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
  const [user, setUser] = useState<User | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [data , setData] = useState({});
  
  useEffect(() => {
    setIsClient(true)
    
    const fetchSession = async () => {
      const session = await getSession()
      if (session?.user) {
        setUser({
          name: session.user.name || undefined,
          email: session.user.email || '',
          role: session.user.role || ''
        })
      }
    }

    fetchSession()

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
    
    fetchDashboardData();
  }, [])

  if (!isClient) return null;
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

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
