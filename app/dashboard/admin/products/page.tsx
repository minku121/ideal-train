"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Filter, Plus, Package, ShoppingCart, Edit, Trash } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  managerId: number;
  dealType: string;
  campaignType: string;
  commission: number | null;
  exchangeNotes: string | null;
  createdAt: string;
  brand: { name: string };
  manager: { user: { name: string; email: string } };
  orderCount: number;
};

type PaginationInfo = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type FilterOptions = {
  brandId?: string;
  managerId?: string;
};

type Brand = {
  id: number;
  name: string;
  createdAt: string;
};

export default function AdminProductsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<FilterOptions>({});
  const [brands, setBrands] = useState<Brand[]>([]);
  const [mediators, setMediators] = useState<{id: number, name: string}[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBrandDialog, setShowBrandDialog] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [newBrand, setNewBrand] = useState({
    name: "",
  });
  
  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: "",
    brandId: "",
    managerId: "",
    dealType: "ORIGINAL",
    campaignType: "RATING_DEAL",
    commission: "",
    exchangeNotes: ""
  });

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
    fetchProducts(pagination.page, pagination.limit);
    
    // Fetch brands and mediators for filters
    fetchBrands();
    fetchMediators();
  }, [router, session, status]);
  
  // Fetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchProducts(1, pagination.limit, filters);
    }
  }, [filters]);

  const fetchProducts = async (page: number, limit: number, filterOptions: FilterOptions = {}) => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (filterOptions.brandId) {
        params.append('brandId', filterOptions.brandId);
      }
      
      if (filterOptions.managerId) {
        params.append('managerId', filterOptions.managerId);
      }
      
      const response = await fetch(`/api/admin/products?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.products);
      setPagination(data.pagination);
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
  
  const fetchMediators = async () => {
    try {
      const response = await fetch('/api/admin/mediators');
      if (response.ok) {
        const data = await response.json();
        const formattedMediators = data.mediators.map((mediator: any) => ({
          id: mediator.id,
          name: mediator.name || mediator.email
        }));
        setMediators(formattedMediators);
      }
    } catch (error) {
      console.error("Error fetching mediators:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
      fetchProducts(newPage, pagination.limit, filters);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    if (value === "ALL") {
      const newFilters = { ...filters };
      delete newFilters[key as keyof FilterOptions];
      setFilters(newFilters);
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const clearFilters = () => {
    setFilters({});
  };
  
  const handleNewProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newProduct.name,
          brandId: parseInt(newProduct.brandId),
          managerId: parseInt(newProduct.managerId),
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
        managerId: "",
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

  const handleNewBrandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewBrand(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newBrand.name
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add brand");
      }
      
      const result = await response.json();
      
      // Add new brand to the list
      setBrands(prev => [...prev, result.brand]);
      
      // Reset form
      setNewBrand({
        name: ""
      });
      
      setShowBrandDialog(false);
      toast.success("Brand added successfully");
      
    } catch (error: any) {
      toast.error(`Failed to add brand: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setNewBrand({ name: brand.name });
    setShowBrandDialog(true);
  };
  
  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/admin/brands/${editingBrand.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newBrand.name
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update brand");
      }
      
      const result = await response.json();
      
      // Update brand in the list
      setBrands(prev => prev.map(brand => 
        brand.id === editingBrand.id ? { ...brand, name: newBrand.name } : brand
      ));
      
      // Reset form
      setNewBrand({
        name: ""
      });
      
      setShowBrandDialog(false);
      setEditingBrand(null);
      toast.success("Brand updated successfully");
      
    } catch (error: any) {
      toast.error(`Failed to update brand: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteBrand = async (brandId: number) => {
    if (!confirm("Are you sure you want to delete this brand? This will also remove all associated products.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/brands/${brandId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete brand");
      }
      
      // Remove brand from the list
      setBrands(prev => prev.filter(brand => brand.id !== brandId));
      
      toast.success("Brand deleted successfully");
      
    } catch (error: any) {
      toast.error(`Failed to delete brand: ${error.message}`);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
          Product Management
        </h1>
        <Loader text="Loading products..." size="md" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">
          Product Management
        </h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          
          <Dialog open={showBrandDialog} onOpenChange={(open) => {
            setShowBrandDialog(open);
            if (!open) setEditingBrand(null);
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Manage Brands
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>{editingBrand ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
                <DialogDescription>
                  {editingBrand ? 'Update brand information.' : 'Add a new brand to the system.'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={editingBrand ? handleUpdateBrand : handleAddBrand} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="brandName">Brand Name*</Label>
                  <Input 
                    id="brandName"
                    name="name"
                    placeholder="Enter brand name"
                    value={newBrand.name}
                    onChange={handleNewBrandChange}
                    required
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowBrandDialog(false);
                    setEditingBrand(null);
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader size="sm" className="mr-2" /> : editingBrand ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {editingBrand ? 'Update Brand' : 'Add Brand'}
                  </Button>
                </DialogFooter>
              </form>
              
              {!editingBrand && (
                <>
                  <div className="my-4">
                    <h3 className="text-sm font-medium">Existing Brands</h3>
                    <div className="mt-2 max-h-[200px] overflow-y-auto">
                      {brands.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No brands yet. Add one above.</p>
                      ) : (
                        <div className="space-y-2">
                          {brands.map(brand => (
                            <div key={brand.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                              <span>{brand.name}</span>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditBrand(brand)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteBrand(brand.id)}
                                >
                                  <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
          
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
                  Create a new product in the system. Fill out all required fields.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddProduct} className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4">
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
                    <Label htmlFor="managerId">Mediator/Manager*</Label>
                    <Select 
                      name="managerId" 
                      value={newProduct.managerId} 
                      onValueChange={(value) => setNewProduct(prev => ({ ...prev, managerId: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Mediator" />
                      </SelectTrigger>
                      <SelectContent>
                        {mediators.map(mediator => (
                          <SelectItem key={mediator.id} value={mediator.id.toString()}>
                            {mediator.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <input type="hidden" name="dealType" value="ORIGINAL" />
                  <input type="hidden" name="campaignType" value="RATING_DEAL" />
                  
                  <div className="space-y-2">
                    <Label htmlFor="commission">Commission Amount (Optional)</Label>
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
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filter Products</CardTitle>
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
                    <SelectItem value="ALL">All Brands</SelectItem>
                    {brands.map(brand => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="mediatorFilter">Mediator</Label>
                <Select 
                  value={filters.managerId || ""} 
                  onValueChange={(value) => handleFilterChange("managerId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Mediators" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Mediators</SelectItem>
                    {mediators.map(mediator => (
                      <SelectItem key={mediator.id} value={mediator.id.toString()}>
                        {mediator.name}
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
            No products found matching your criteria.
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
                <th className="py-3 px-4 text-left">Manager</th>
                <th className="py-3 px-4 text-left">Deal Type</th>
                <th className="py-3 px-4 text-left">Campaign Type</th>
                <th className="py-3 px-4 text-left">Commission</th>
                <th className="py-3 px-4 text-left">Orders</th>
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
                    <div>
                      <div>{product.manager.user.name}</div>
                      <div className="text-xs text-gray-500">{product.manager.user.email}</div>
                    </div>
                  </td>
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
                    <div className="flex items-center">
                      <ShoppingCart className="h-4 w-4 mr-1 text-gray-400" />
                      <span>{product.orderCount}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {format(new Date(product.createdAt), "MMM d, yyyy")}
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
                of {pagination.total} products
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
    </div>
  );
} 