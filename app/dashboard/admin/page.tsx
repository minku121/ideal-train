"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { BarChart3, Package, ShoppingCart, Users } from "lucide-react"
import { format } from "date-fns"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader } from "@/components/ui/loader"
import { Badge } from "@/components/ui/badge"
import { DashboardChart } from "@/components/DashboardChart"

interface AnalyticsData {
  summary: {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    userGrowth: number;
    productGrowth: number;
    orderGrowth: number;
    revenueGrowth: number;
  };
  details: {
    usersByRole: { role: string; _count: { id: number } }[];
    recentUsers: {
      id: number;
      name: string;
      email: string;
      role: string;
      createdAt: string;
    }[];
    productsByDealType: { dealType: string; _count: { id: number } }[];
    ordersByProofStatus: { orderProofStatus: string; _count: { id: number } }[];
  };
  charts: {
    monthlyOrders: { dateOfOrder: string; _count: { id: number } }[];
    monthlyUsers: { createdAt: string; _count: { id: number } }[];
  };
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsClient(true)
    
    // Check session status
    if (status === "loading") return;
    
    // Redirect if not admin
    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/dashboard")
      return;
    }

    // Fetch analytics data
    fetchAnalyticsData();
  }, [router, session, status])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/analytics");
      
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }
      
      const data = await response.json();
      setAnalyticsData(data);
      setError(null);
    } catch (err: any) {
      setError("Error loading analytics data: " + err.message);
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isClient || status === "loading" || loading) {
    return <Loader fullScreen text="Loading admin dashboard..." />
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
        <Button onClick={fetchAnalyticsData}>Retry</Button>
      </div>
    );
  }

  if (!session?.user) {
    return null
  }

  const user = {
    name: session.user.name,
    email: session.user.email || "",
    role: session.user.role || ""
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name || user.email}! Here's an overview of your platform.
        </p>
      </div>

      {analyticsData && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.summary.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{analyticsData.summary.userGrowth}% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.summary.totalProducts.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{analyticsData.summary.productGrowth}% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.summary.totalOrders.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{analyticsData.summary.orderGrowth}% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analyticsData.summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">
                  +{analyticsData.summary.revenueGrowth}% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Users by Role</CardTitle>
                <CardDescription>Distribution of users across different roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.details.usersByRole.map((roleData) => (
                    <div key={roleData.role} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{roleData.role}</Badge>
                        <span className="font-medium">{roleData._count.id}</span>
                      </div>
                      <div className="w-2/3 bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ 
                            width: `${(roleData._count.id / analyticsData.summary.totalUsers) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Latest registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.details.recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-4">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="ml-auto">
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Monthly Stats Chart */}
          <DashboardChart 
            monthlyOrders={analyticsData.charts.monthlyOrders}
            monthlyUsers={analyticsData.charts.monthlyUsers}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Products by Deal Type</CardTitle>
                <CardDescription>Distribution of products by deal type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.details.productsByDealType.map((dealTypeData) => (
                    <div key={dealTypeData.dealType} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{dealTypeData.dealType}</Badge>
                        <span className="font-medium">{dealTypeData._count.id}</span>
                      </div>
                      <div className="w-2/3 bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
                        <div 
                          className="bg-green-500 h-2.5 rounded-full" 
                          style={{ 
                            width: `${(dealTypeData._count.id / analyticsData.summary.totalProducts) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
                <CardDescription>Distribution of orders by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.details.ordersByProofStatus.map((statusData) => (
                    <div key={statusData.orderProofStatus} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            statusData.orderProofStatus === "APPROVED" ? "default" :
                            statusData.orderProofStatus === "REJECTED" ? "destructive" :
                            "outline"
                          }
                        >
                          {statusData.orderProofStatus}
                        </Badge>
                        <span className="font-medium">{statusData._count.id}</span>
                      </div>
                      <div className="w-2/3 bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            statusData.orderProofStatus === "APPROVED" ? "bg-green-500" :
                            statusData.orderProofStatus === "REJECTED" ? "bg-red-500" :
                            "bg-amber-500"
                          }`}
                          style={{ 
                            width: `${(statusData._count.id / analyticsData.summary.totalOrders) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
