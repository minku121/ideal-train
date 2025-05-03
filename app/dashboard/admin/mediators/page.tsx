"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Filter, Plus, Store, Users } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Mediator = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  brandManagers: {
    brand: {
      id: number;
      name: string;
    }
  }[];
};

type Brand = {
  id: number;
  name: string;
};

type PaginationInfo = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function AdminMediatorsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mediators, setMediators] = useState<Mediator[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [selectedMediatorId, setSelectedMediatorId] = useState<number | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  
  // Fetch admin access check
  useEffect(() => {
    // Check if loading session
    if (status === "loading") return;
    
    // Check if user is not authenticated or doesn't have correct role
    if (!session?.user || session.user.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }

    // Initial fetch
    fetchMediators(pagination.page, pagination.limit);
    fetchBrands();
  }, [router, session, status]);

  const fetchMediators = async (page: number, limit: number) => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      const response = await fetch(`/api/admin/mediators?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch mediators");
      }

      const data = await response.json();
      setMediators(data.mediators);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError("Error loading mediators. Please try again.");
      console.error("Error fetching mediators:", err);
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

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
      fetchMediators(newPage, pagination.limit);
    }
  };
  
  const handleAssignMediator = async () => {
    if (!selectedMediatorId || !selectedBrandId) {
      toast.error("Please select both a mediator and a brand");
      return;
    }
    
    setIsAssigning(true);
    
    try {
      const response = await fetch('/api/admin/mediators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mediatorId: selectedMediatorId,
          brandId: parseInt(selectedBrandId)
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign mediator to brand");
      }
      
      const result = await response.json();
      
      // Update mediator in the list with new brand
      setMediators(prev => 
        prev.map(mediator => 
          mediator.id === selectedMediatorId
            ? {
                ...mediator,
                brandManagers: [
                  ...mediator.brandManagers,
                  {
                    brand: {
                      id: parseInt(selectedBrandId),
                      name: brands.find(b => b.id === parseInt(selectedBrandId))?.name || "Unknown Brand"
                    }
                  }
                ]
              }
            : mediator
        )
      );
      
      setShowAssignDialog(false);
      setSelectedMediatorId(null);
      setSelectedBrandId("");
      
      toast.success("Mediator assigned to brand successfully");
      
    } catch (error: any) {
      toast.error(`Failed to assign mediator: ${error.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  if (loading && mediators.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
          Mediator Management
        </h1>
        <Loader text="Loading mediators..." size="md" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">
          Mediator Management
        </h1>
        <div className="flex gap-2">
          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Assign Brand
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Assign Brand to Mediator</DialogTitle>
                <DialogDescription>
                  Select a mediator and brand to create an association.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="mediatorId">Mediator</Label>
                  <Select 
                    value={selectedMediatorId ? String(selectedMediatorId) : ""} 
                    onValueChange={(value) => setSelectedMediatorId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Mediator" />
                    </SelectTrigger>
                    <SelectContent>
                      {mediators.map(mediator => (
                        <SelectItem key={mediator.id} value={String(mediator.id)}>
                          {mediator.name || mediator.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="brandId">Brand</Label>
                  <Select 
                    value={selectedBrandId} 
                    onValueChange={setSelectedBrandId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map(brand => (
                        <SelectItem key={brand.id} value={String(brand.id)}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAssignDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAssignMediator} 
                    disabled={isAssigning || !selectedMediatorId || !selectedBrandId}
                  >
                    {isAssigning ? <Loader size="sm" className="mr-2" /> : <Store className="h-4 w-4 mr-2" />}
                    Assign Brand
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
      ) : mediators.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center"
        >
          <p className="text-gray-500 dark:text-gray-300 text-lg">
            No mediators found in the system.
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
                <th className="py-3 px-4 text-left">Mediator</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Assigned Brands</th>
                <th className="py-3 px-4 text-left">Created</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {mediators.map((mediator) => (
                <tr
                  key={mediator.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <td className="py-3 px-4 font-medium">{mediator.name || 'No name'}</td>
                  <td className="py-3 px-4">{mediator.email}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-2">
                      {mediator.brandManagers.length > 0 ? (
                        mediator.brandManagers.map((bm, idx) => (
                          <Badge key={idx} variant="outline" className="bg-blue-50">
                            {bm.brand.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">No brands assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {format(new Date(mediator.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => {
                        setSelectedMediatorId(mediator.id);
                        setShowAssignDialog(true);
                      }}
                    >
                      <Store className="h-3.5 w-3.5" />
                      <span>Assign Brand</span>
                    </Button>
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
                of {pagination.total} mediators
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