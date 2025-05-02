"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader } from "@/components/ui/loader";

export default function ProductsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    brandId: "",
    dealType: "ORIGINAL",
    campaignType: "RATING_DEAL",
    orderId: "",
    managerId: "",
    commission: "",
    exchangeNotes: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // For demo, you might want to fetch brands, managers, orders, etc.
  // Here we just use text fields for simplicity.

  useEffect(() => {
    setLoading(true);
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || '{}');
      setUser(userObj);
      if (!userObj || (userObj.role !== "SELLER" && userObj.role !== "ADMIN")) {
        router.replace("/dashboard");
        return;
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setSubmitting(true);

    // Prepare payload
    const payload = {
      ...form,
      commission: form.commission !== "" ? Number(form.commission) : undefined,
      brandId: form.brandId !== "" ? Number(form.brandId) : undefined,
      orderId: form.orderId !== "" ? Number(form.orderId) : undefined,
      managerId: form.managerId !== "" ? Number(form.managerId) : undefined,
      exchangeNotes: form.exchangeNotes !== "" ? form.exchangeNotes : undefined,
    };

    try {
      const res = await fetch("/api/product/add-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Product added successfully!");
        setForm({
          name: "",
          brandId: "",
          dealType: "ORIGINAL",
          campaignType: "RATING_DEAL",
          orderId: "",
          managerId: "",
          commission: "",
          exchangeNotes: "",
        });
      } else {
        setError(data.error || "Failed to add product");
      }
    } catch (err) {
      setError("Failed to add product");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
          Products
        </h1>
        <Loader text="Loading products..." size="md" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold mb-4 text-gray-800 dark:text-white">Products</h1>
      <p className="text-gray-600 dark:text-gray-300">Manage your products here.</p>
      {(user && user.role === "ADMIN") && (
        <div className="mt-8 max-w-lg border rounded p-6">
          <h2 className="text-lg font-semibold mb-4">Add Product</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Brand ID</label>
              <input
                type="number"
                name="brandId"
                value={form.brandId}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Deal Type</label>
              <select
                name="dealType"
                value={form.dealType}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
                required
              >
                <option value="ORIGINAL">ORIGINAL</option>
                <option value="EMPTY">EMPTY</option>
                <option value="EXCHANGE">EXCHANGE</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Campaign Type</label>
              <select
                name="campaignType"
                value={form.campaignType}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
                required
              >
                <option value="RATING_DEAL">RATING_DEAL</option>
                <option value="REVIEW_DEAL">REVIEW_DEAL</option>
                <option value="ORDER_ONLY_DEAL">ORDER_ONLY_DEAL</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Order ID</label>
              <input
                type="number"
                name="orderId"
                value={form.orderId}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Manager ID</label>
              <input
                type="number"
                name="managerId"
                value={form.managerId}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Commission</label>
              <input
                type="number"
                name="commission"
                value={form.commission}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
                step="0.01"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Exchange Notes</label>
              <input
                type="text"
                name="exchangeNotes"
                value={form.exchangeNotes}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 rounded-lg font-medium transition ${submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white flex items-center justify-center`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                'Add Product'
              )}
            </button>
            {message && <div className="text-green-600 mt-2">{message}</div>}
            {error && <div className="text-red-600 mt-2">{error}</div>}
          </form>
        </div>
      )}
    </div>
  );
}
