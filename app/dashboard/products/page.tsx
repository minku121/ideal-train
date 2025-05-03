"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Plus, Package } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Product = {
  id: number;
  name: string;
  brandId: number;
  dealType: string;
  campaignType: string;
  commission: number | null;
  exchangeNotes: string | null;
  createdAt: string;
  brand: { name: string };
};

export default function ProductsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<{id: number, name: string}[]>([]);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: "",
    brandId: "",
    dealType: "ORIGINAL",
    campaignType: "RATING_DEAL",
    commission: "",
    exchangeNotes: ""
  });

  // Check session and fetch data
  useEffect(() => {
    // Check if loading session
    if (status === "loading") return;
    
    // Check if user is not authenticated or is not a seller
    if (!session?.user || session.user.role !== "SELLER") {
      router.replace("/dashboard");
      return;
    }

    // Fetch products and brands
    fetchSellerProducts();
    fetchBrands();
  }, [router, session, status]);

  const fetchSellerProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/seller/products");
      
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      
      const data = await response.json();
      setProducts(data.products);
      setError(null);
    } catch (err) {
      setError("Error loading products. Please try again.");
      console.error("Error fetching products:", err);
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

  const handleNewProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newProduct.name,
          brandId: parseInt(newProduct.brandId),
          dealType: newProduct.dealType,
          campaignType: newProduct.campaignType,
          commission: newProduct.commission ? parseFloat(newProduct.commission) : null,
          exchangeNotes: newProduct.exchangeNotes || null
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add product");
      }
      
      const result = await response.json();
      
      // Add new product to the list
      setProducts(prev => [result.product, ...prev]);
      
      // Reset form
      setNewProduct({
        name: "",
        brandId: "",
        dealType: "ORIGINAL",
        campaignType: "RATING_DEAL",
        commission: "",
        exchangeNotes: ""
      });
      
      setShowAddProductDialog(false);
      toast.success("Product added successfully");
      
    } catch (error: any) {
      toast.error(`Failed to add product: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
          My Products
        </h1>
        <Loader text="Loading products..." size="md" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">
          My Products
        </h1>
        <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Create a new product. Fill out all required fields.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAddProduct} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name*</Label>
                  <Input 
                    id="name"
                    name="name"
                    placeholder="Enter product name"
                    value={newProduct.name}
                    onChange={handleNewProductChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="brandId">Brand*</Label>
                  <Select 
                    name="brandId" 
                    value={newProduct.brandId} 
                    onValueChange={(value) => setNewProduct(prev => ({ ...prev, brandId: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map(brand => (
                        <SelectItem key={brand.id} value={brand.id.toString()}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dealType">Deal Type*</Label>
                  <Select 
                    name="dealType" 
                    value={newProduct.dealType} 
                    onValueChange={(value) => setNewProduct(prev => ({ ...prev, dealType: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORIGINAL">ORIGINAL</SelectItem>
                      <SelectItem value="EMPTY">EMPTY</SelectItem>
                      <SelectItem value="EXCHANGE">EXCHANGE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="campaignType">Campaign Type*</Label>
                  <Select 
                    name="campaignType" 
                    value={newProduct.campaignType} 
                    onValueChange={(value) => setNewProduct(prev => ({ ...prev, campaignType: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RATING_DEAL">RATING_DEAL</SelectItem>
                      <SelectItem value="REVIEW_DEAL">REVIEW_DEAL</SelectItem>
                      <SelectItem value="ORDER_ONLY_DEAL">ORDER_ONLY_DEAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="commission">Commission Amount</Label>
                  <Input 
                    id="commission"
                    name="commission"
                    type="number"
                    step="0.01"
                    placeholder="Optional"
                    value={newProduct.commission}
                    onChange={handleNewProductChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exchangeNotes">Exchange Notes</Label>
                <Textarea 
                  id="exchangeNotes"
                  name="exchangeNotes"
                  placeholder="Optional notes for exchange products"
                  value={newProduct.exchangeNotes}
                  onChange={handleNewProductChange}
                  rows={3}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddProductDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader size="sm" className="mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Product
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
      ) : products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center"
        >
          <p className="text-gray-500 dark:text-gray-300 text-lg">
            You haven't added any products yet.
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
                <th className="py-3 px-4 text-left">Product Name</th>
                <th className="py-3 px-4 text-left">Brand</th>
                <th className="py-3 px-4 text-left">Deal Type</th>
                <th className="py-3 px-4 text-left">Campaign Type</th>
                <th className="py-3 px-4 text-left">Commission</th>
                <th className="py-3 px-4 text-left">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <td className="py-3 px-4 font-medium">{product.name}</td>
                  <td className="py-3 px-4">{product.brand.name}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{product.dealType}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{product.campaignType}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    {product.commission !== null ? `$${product.commission.toFixed(2)}` : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    {format(new Date(product.createdAt), "MMM d, yyyy")}
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
