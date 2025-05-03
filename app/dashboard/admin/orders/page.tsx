"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { CheckCircle, Filter, ImageIcon, Search, XCircle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { Loader } from "@/components/ui/loader";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Product = {
  id: number;
  name: string;
};

type OrderProduct = {
  product: Product;
};

type OrderScreenshot = {
  productId: number;
  screenshotUrl: string;
};

type Order = {
  id: number;
  orderId: string;
  dateOfOrder: string;
  createdAt: string;
  orderProofStatus: string;
  brand: { name: string };
  buyer: { name: string; email: string };
  brandManager: { user: { name: string; email: string } };
  orderProducts: OrderProduct[];
  orderScreenshots: OrderScreenshot[];
  exchangeNotes?: string;
};

type PaginationInfo = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type FilterOptions = {
  status?: string;
  brandId?: string;
  buyerId?: string;
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<FilterOptions>({});
  const [brands, setBrands] = useState<{id: number, name: string}[]>([]);
  const [buyers, setBuyers] = useState<{id: number, name: string}[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);

  // Fetch admin access check
  useEffect(() => {
    // Check if loading session
    if (status === "loading") return;
    
    // Check if user is not authenticated or doesn't have correct role
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MEDIATOR")) {
      router.replace("/dashboard");
      return;
    }

    // Initial fetch
    fetchOrders(pagination.page, pagination.limit);
    
    // Fetch brands and buyers for filters
    fetchBrands();
    fetchBuyers();
  }, [router, session, status]);

  // Fetch when tab changes
  useEffect(() => {
    const statusFilter = activeTab === "all" ? undefined 
      : activeTab === "pending" ? "SUBMITTED"
      : activeTab === "approved" ? "APPROVED"
      : "REJECTED";
      
    setFilters(prev => ({ ...prev, status: statusFilter }));
    fetchOrders(1, pagination.limit, { ...filters, status: statusFilter });
  }, [activeTab]);
  
  // Fetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchOrders(1, pagination.limit, filters);
    }
  }, [filters]);

  const fetchOrders = async (page: number, limit: number, filterOptions: FilterOptions = {}) => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (filterOptions.status) {
        params.append('status', filterOptions.status);
      }
      
      if (filterOptions.brandId) {
        params.append('brandId', filterOptions.brandId);
      }
      
      if (filterOptions.buyerId) {
        params.append('buyerId', filterOptions.buyerId);
      }
      
      const response = await fetch(`/api/admin/orders?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.orders);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError("Error loading orders. Please try again.");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands');
      if (response.ok) {
        const data = await response.json();
        setBrands(data);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };
  
  const fetchBuyers = async () => {
    try {
      const response = await fetch('/api/buyers');
      if (response.ok) {
        const data = await response.json();
        setBuyers(data);
      }
    } catch (error) {
      console.error("Error fetching buyers:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
      fetchOrders(newPage, pagination.limit, filters);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    if (value === "") {
      const newFilters = { ...filters };
      delete newFilters[key as keyof FilterOptions];
      setFilters(newFilters);
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const clearFilters = () => {
    setFilters({});
    const statusFilter = activeTab === "all" ? undefined 
      : activeTab === "pending" ? "SUBMITTED"
      : activeTab === "approved" ? "APPROVED"
      : "REJECTED";
    
    if (statusFilter) {
      setFilters({ status: statusFilter });
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900";
    }
  };

  // Helper to find screenshot for a specific product
  const getScreenshotForProduct = (order: Order, productId: number) => {
    return order.orderScreenshots.find(screenshot => screenshot.productId === productId)?.screenshotUrl;
  };
  
  const updateOrderStatus = async (orderId: number, status: "APPROVED" | "REJECTED", notes?: string) => {
    try {
      setProcessingOrderId(orderId);
      
      const response = await fetch('/api/admin/orders/update-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status,
          notes
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update order status");
      }
      
      const result = await response.json();
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, orderProofStatus: status, ...(notes && { exchangeNotes: notes }) }
            : order
        )
      );
      
      toast.success(`Order ${status === "APPROVED" ? "approved" : "rejected"} successfully`);
      setSelectedOrder(null);
      setRejectionNote("");
      
    } catch (error: any) {
      toast.error(`Failed to update order: ${error.message}`);
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleApprove = (order: Order) => {
    updateOrderStatus(order.id, "APPROVED");
  };
  
  const handleReject = (order: Order) => {
    setSelectedOrder(order);
  };
  
  const submitRejection = () => {
    if (selectedOrder) {
      updateOrderStatus(selectedOrder.id, "REJECTED", rejectionNote);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
          Order Management
        </h1>
        <Loader text="Loading orders..." size="md" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">
          Order Management
        </h1>
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filter Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="brandFilter">Brand</Label>
                <Select 
                  value={filters.brandId || ""} 
                  onValueChange={(value) => handleFilterChange("brandId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Brands</SelectItem>
                    {brands.map(brand => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="buyerFilter">Buyer</Label>
                <Select 
                  value={filters.buyerId || ""} 
                  onValueChange={(value) => handleFilterChange("buyerId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Buyers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Buyers</SelectItem>
                    {buyers.map(buyer => (
                      <SelectItem key={buyer.id} value={buyer.id.toString()}>
                        {buyer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button onClick={clearFilters} variant="outline" className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg dark:bg-red-200"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </motion.div>
      ) : orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center"
        >
          <p className="text-gray-500 dark:text-gray-300 text-lg">
            No orders found matching your criteria.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="overflow-x-auto rounded-xl shadow-md"
        >
          <table className="min-w-full divide-y divide-gray-200 bg-background rounded-xl overflow-hidden">
            <thead className="text-gray-700 text-sm uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 text-left">Order ID</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Brand</th>
                <th className="py-3 px-4 text-left">Buyer</th>
                <th className="py-3 px-4 text-left">Products</th>
                <th className="py-3 px-4 text-left">Screenshots</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <td className="py-3 px-4">{order.orderId}</td>
                  <td className="py-3 px-4">
                    {format(new Date(order.dateOfOrder), "MMM d, yyyy")}
                  </td>
                  <td className="py-3 px-4">{order.brand.name}</td>
                  <td className="py-3 px-4">
                    <div>
                      <div>{order.buyer.name}</div>
                      <div className="text-xs text-gray-500">{order.buyer.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <ul className="list-disc list-inside space-y-1">
                      {order.orderProducts.map((op, idx) => (
                        <li key={idx}>{op.product.name}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-2">
                      {order.orderProducts.map((op, idx) => {
                        const screenshotUrl = getScreenshotForProduct(order, op.product.id);
                        return (
                          <div key={idx} className="relative">
                            {screenshotUrl ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="flex items-center space-x-1">
                                    <ImageIcon className="h-4 w-4" />
                                    <span>View</span>
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogTitle className="sr-only">
                                    Screenshot for {op.product.name}
                                  </DialogTitle>
                                  <div className="relative w-full h-[400px]">
                                    <Image 
                                      src={screenshotUrl} 
                                      alt={`Screenshot for ${op.product.name}`} 
                                      fill 
                                      style={{ objectFit: 'contain' }} 
                                      unoptimized
                                    />
                                  </div>
                                  <p className="text-center mt-2">{op.product.name}</p>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <span className="text-gray-400 text-xs">No image</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      className={getStatusBadgeClass(order.orderProofStatus)}
                    >
                      {order.orderProofStatus}
                    </Badge>
                    {order.orderProofStatus === "REJECTED" && order.exchangeNotes && (
                      <div className="mt-1">
                        <dialog>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-gray-500 hover:underline"
                            onClick={() => {
                              alert(`Rejection reason: ${order.exchangeNotes}`);
                            }}
                          >
                            View reason
                          </Button>
                        </dialog>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {order.orderProofStatus === "SUBMITTED" && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          onClick={() => handleApprove(order)}
                          disabled={processingOrderId === order.id}
                        >
                          {processingOrderId === order.id ? (
                            <Loader size="sm" className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          <span>Approve</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          onClick={() => handleReject(order)}
                          disabled={processingOrderId === order.id}
                        >
                          {processingOrderId === order.id ? (
                            <Loader size="sm" className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          <span>Reject</span>
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 px-2">
              <div className="text-sm text-gray-500 dark:text-gray-300">
                Showing{" "}
                {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )}{" "}
                of {pagination.total} orders
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  variant={pagination.page === 1 ? "outline" : "default"}
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  variant={pagination.page === pagination.totalPages ? "outline" : "default"}
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Rejection Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent>
            <DialogTitle>Reject Order #{selectedOrder.orderId}</DialogTitle>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="rejectionNote">Reason for Rejection</Label>
                <Textarea
                  id="rejectionNote"
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Please provide a reason for rejecting this order"
                  className="mt-2"
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={submitRejection}
                  disabled={processingOrderId === selectedOrder.id}
                >
                  {processingOrderId === selectedOrder.id ? (
                    <Loader size="sm" className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject Order
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 