"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Loader } from "@/components/ui/loader";
import { format } from "date-fns";
import Image from "next/image";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";

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
  brandManager: { user: { name: string } };
  orderProducts: OrderProduct[];
  orderScreenshots: OrderScreenshot[];
};

export default function PendingOrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPendingOrders() {
      if (status === "loading") return;
      
      if (!session?.user || session.user.role !== "BUYER") {
        router.replace("/dashboard");
        return;
      }
      
      setLoading(true);
      try {
        // Fetch orders with SUBMITTED status
        const response = await fetch('/api/buyer/my-orders');
        
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        
        const data = await response.json();
        // Filter orders with SUBMITTED status
        const submitted = data.orders.filter((order: Order) => 
          order.orderProofStatus === "SUBMITTED"
        );
        
        setPendingOrders(submitted);
      } catch (error) {
        console.error("Error loading pending orders:", error);
        setError("Failed to load pending orders. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchPendingOrders();
  }, [router, session, status]);

  // Helper to find screenshot for a specific product
  const getScreenshotForProduct = (order: Order, productId: number) => {
    return order.orderScreenshots.find(screenshot => screenshot.productId === productId)?.screenshotUrl;
  };

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

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
          Pending Orders
        </h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg dark:bg-red-200"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold mb-4 text-gray-800 dark:text-white">Pending Orders</h1>
      <p className="text-gray-600 dark:text-gray-300">Orders waiting for approval</p>
      
      {pendingOrders.length === 0 ? (
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
                <th className="py-3 px-4 text-left">Manager</th>
                <th className="py-3 px-4 text-left">Products</th>
                <th className="py-3 px-4 text-left">Screenshots</th>
                <th className="py-3 px-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {pendingOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <td className="py-3 px-4">{order.orderId}</td>
                  <td className="py-3 px-4">
                    {format(new Date(order.dateOfOrder), "MMM d, yyyy")}
                  </td>
                  <td className="py-3 px-4">{order.brand.name}</td>
                  <td className="py-3 px-4">{order.brandManager.user.name}</td>
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
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900">
                      {order.orderProofStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
