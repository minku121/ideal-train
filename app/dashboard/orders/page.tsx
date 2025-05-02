"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Loader } from "@/components/ui/loader";

type Product = {
  name: string;
};

type OrderProduct = {
  product: Product;
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
};

type PaginationInfo = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(storedTheme as "light" | "dark");
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user || user.role !== "BUYER") {
      router.replace("/dashboard");
      return;
    }

    fetchOrders(pagination.page, pagination.limit);
  }, [router, pagination.page, pagination.limit, theme]);

  useEffect(() => {
    document.body.className = theme === "dark" ? "dark" : "light";
  }, [theme]);

  const fetchOrders = async (page: number, limit: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/buyer/my-orders?page=${page}&limit=${limit}`
      );

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

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
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

  if (loading && orders.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
          My Orders
        </h1>
        <Loader text="Loading orders..." size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
          My Orders
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
      <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">
        My Orders
      </h1>

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center"
        >
          <p className="text-gray-500 dark:text-gray-300 text-lg">
            You haven't placed any orders yet.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="overflow-x-auto rounded-xl shadow-md"
        >
          <table className="min-w-full divide-y divide-gray-200  bg-background  rounded-xl overflow-hidden">
            <thead className=" text-gray-700  text-sm uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 text-left">Order ID</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Brand</th>
                <th className="py-3 px-4 text-left">Manager</th>
                <th className="py-3 px-4 text-left">Products</th>
                <th className="py-3 px-4 text-left">Status</th>
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
                  <td className="py-3 px-4">{order.brandManager.user.name}</td>
                  <td className="py-3 px-4">
                    <ul className="list-disc list-inside space-y-1">
                      {order.orderProducts.map((op, idx) => (
                        <li key={idx}>{op.product.name}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(
                        order.orderProofStatus
                      )}`}
                    >
                      {order.orderProofStatus}
                    </span>
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
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${
                    pagination.page === 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${
                    pagination.page === pagination.totalPages
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
