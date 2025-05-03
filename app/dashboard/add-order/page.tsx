"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { Loader2 } from "lucide-react";

// These are just for fallback UI, real data comes from API
const CAMPAIGN_TYPES = [
  { label: "RATING_DEAL", value: "RATING_DEAL" },
  { label: "REVIEW_DEAL", value: "REVIEW_DEAL" },
  { label: "ORDER_ONLY_DEAL", value: "ORDER_ONLY_DEAL" },
];
const DEAL_TYPES = [
  { label: "ORIGINAL", value: "ORIGINAL" },
  { label: "EMPTY", value: "EMPTY" },
  { label: "EXCHANGE", value: "EXCHANGE" },
];

// Impressive Loader Component
function ImpressiveLoader({ text }: { text?: string }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none">
      <div className="relative flex items-center justify-center mb-2">
        <span className="sr-only">Loading...</span>
        <div className="w-14 h-14 rounded-full border-4 border-blue-400 border-t-transparent animate-spin" />
        <div className="absolute w-8 h-8 rounded-full border-2 border-blue-200 border-t-transparent animate-spin-slow" />
        <svg
          className="absolute w-6 h-6 text-blue-500 animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-30"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            className="opacity-80"
            fill="currentColor"
            d="M12 6v6l4 2"
          />
        </svg>
      </div>
      <span className="text-blue-700 text-sm font-medium drop-shadow">
        {text || "Loading..."}
      </span>
    </div>
  );
}

// Helper to get today's date in yyyy-mm-dd format
function getTodayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// --- API INTEGRATION HELPERS ---
async function fetchBrands() {
  const res = await fetch("/api/buyer/getbrands");
  if (!res.ok) throw new Error("Failed to fetch brands");
  return await res.json();
}

async function fetchManagers(brandId: number) {
  const res = await fetch(`/api/buyer/getmanagers?brandId=${brandId}`);
  if (!res.ok) throw new Error("Failed to fetch managers");
  return await res.json();
}

async function fetchProducts(brandId: number, managerId: number) {
  const res = await fetch(`/api/buyer/getproduct?brandId=${brandId}&managerId=${managerId}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return await res.json();
}

async function addOrderApi(payload: any) {
  const res = await fetch("/api/buyer/add-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to submit order");
  return result;
}

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export default function AddOrderPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [submitted, setSubmitted] = useState(false);
  const [orderProofTab, setOrderProofTab] = useState("pending");
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [managers, setManagers] = useState<{ id: number; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [selectedManager, setSelectedManager] = useState<number | null>(null);

  // Loading states
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [managersLoading, setManagersLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user || session.user.role !== "BUYER") {
      router.replace("/dashboard");
    }
  }, [router, session, status]);

  // Fetch brands from API
  useEffect(() => {
    setBrandsLoading(true);
    fetchBrands()
      .then(data => setBrands(data || []))
      .catch(() => setBrands([]))
      .finally(() => setBrandsLoading(false));
  }, []);

  // Fetch managers for selected brand from API
  useEffect(() => {
    if (selectedBrand) {
      setManagersLoading(true);
      fetchManagers(selectedBrand)
        .then(data => setManagers(data || []))
        .catch(() => setManagers([]))
        .finally(() => setManagersLoading(false));
    } else {
      setManagers([]);
      setProducts([]);
      setManagersLoading(false);
      setProductsLoading(false);
    }
  }, [selectedBrand]);

  // Fetch products for selected brand and manager from API
  useEffect(() => {
    if (selectedBrand && selectedManager) {
      setProductsLoading(true);
      fetchProducts(selectedBrand, selectedManager)
        .then(data => setProducts(data || []))
        .catch(() => setProducts([]))
        .finally(() => setProductsLoading(false));
    } else {
      setProducts([]);
      setProductsLoading(false);
    }
  }, [selectedBrand, selectedManager]);

  // Set today's date for date_of_order, non-editable
  const todayDate = getTodayDateString();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      order_id: "",
      date_of_order: todayDate,
      brandId: "",
      products: [{ name: "", screenshot: null }],
      deal_type: "ORIGINAL",
      commission: "",
      exchange_product: "",
      campaign_type: "RATING_DEAL",
      managerId: "",
    },
  });

  // Preview state for screenshots
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);

  // Update screenshot previews when files change
  const handleFileChange = async (index: number, files: FileList | null) => {
    if (files && files.length > 0) {
      try {
        // Start with 0% progress when file is selected
        const newProgress = { ...uploadProgress };
        newProgress[index] = 0;
        setUploadProgress(newProgress);
        
        // Simulate upload progress (in real implementation, this would come from Cloudinary's SDK)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            if (newProgress[index] < 90) {
              newProgress[index] += 10;
            }
            return newProgress;
          });
        }, 300);
        
        const base64 = await fileToBase64(files[0]);
        
        // Create a copy of the current previews array
        const newPreviews = [...screenshotPreviews];
        // Update the preview at the specific index
        newPreviews[index] = base64;
        setScreenshotPreviews(newPreviews);
        
        // Complete the progress
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          newProgress[index] = 100;
          return newProgress;
        });
        
        clearInterval(progressInterval);
      } catch (error) {
        console.error("Error converting file to base64:", error);
        // Reset progress on error
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[index];
          return newProgress;
        });
      }
    }
  };

  // Ensure date_of_order is always today (in case of rerender)
  useEffect(() => {
    setValue("date_of_order", todayDate);
  }, [setValue, todayDate]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "products",
  });

  const dealType = watch("deal_type");

  // Helper: get brandId from brands by name (if needed)
  const getBrandIdByName = (name: string) => {
    const found = brands.find(b => b.name === name);
    return found ? found.id : "";
  };

  // Helper: get managerId from managers by name (if needed)
  const getManagerIdByName = (name: string) => {
    const found = managers.find(m => m.name === name);
    return found ? found.id : "";
  };

  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: any) => {
    setError(null);
    setSubmitting(true);
    setOverallProgress(10); // Start overall progress at 10%
    
    try {
      // Check user authentication
      if (!session?.user || !session.user.id) {
        setError("User not authenticated");
        setSubmitting(false);
        return;
      }
      
      // Find brandId and managerId
      let brandId = data.brandId;
      let managerId = data.managerId;

      // If user selected from dropdown, these are numbers
      if (!brandId && selectedBrand) brandId = selectedBrand;
      if (!managerId && selectedManager) managerId = selectedManager;

      // If still not found, try to resolve from brands/managers arrays
      if (!brandId && data.brandId) brandId = getBrandIdByName(data.brandId);
      if (!managerId && data.managerId) managerId = getManagerIdByName(data.managerId);

      // Prepare screenshots array
      const screenshots = [];
      const formData = new FormData();

      // Compose productIds array and collect screenshots
      const productIds = [];
      for (let i = 0; i < (data.products || []).length; i++) {
        const p = data.products[i];
        const found = products.find(prod => prod.name === p.name);
        
        if (found) {
          productIds.push(found.id);
          
          // Add screenshot if available
          if (p.screenshot && p.screenshot[0]) {
            screenshots.push({
              productId: found.id,
              file: p.screenshot[0]
            });
            
            // Update progress state for this upload
            setUploadProgress(prev => ({
              ...prev,
              [i]: 20 // Start at 20% to indicate processing has begun
            }));
            
            // Add to FormData for upload
            formData.append(`screenshots[${found.id}]`, p.screenshot[0]);
          }
        }
      }

      // Add other form data to FormData
      formData.append("order_id", data.order_id);
      formData.append("date_of_order", todayDate);
      formData.append("brandId", String(brandId));
      formData.append("managerId", String(managerId));
      formData.append("productIds", JSON.stringify(productIds));
      formData.append("deal_type", (data.deal_type || "ORIGINAL").toUpperCase());
      formData.append("campaign_type", (data.campaign_type || "RATING_DEAL").toUpperCase().replace(/ /g, "_"));
      if (data.commission) formData.append("commission", String(data.commission));
      if (data.exchange_product) formData.append("exchange_product", data.exchange_product);

      // Update progress for all uploads to indicate upload started
      screenshots.forEach((screenshot, index) => {
        setUploadProgress(prev => ({
          ...prev,
          [index]: 40 // Upload has begun
        }));
      });
      
      // Use fetch with FormData for multipart upload
      const response = await fetch("/api/buyer/add-order", {
        method: "POST",
        body: formData,
      });
      
      // Update progress for all uploads to indicate server processing
      screenshots.forEach((screenshot, index) => {
        setUploadProgress(prev => ({
          ...prev,
          [index]: 90 // Server is processing
        }));
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to submit order");
      
      // Update progress to complete
      screenshots.forEach((screenshot, index) => {
        setUploadProgress(prev => ({
          ...prev,
          [index]: 100 // Complete
        }));
      });
      
      // Store screenshot URLs from response if available
      if (result.screenshotUrls) {
        // You could store these in local storage or state if needed for later display
        localStorage.setItem(`order_${result.order.id}_screenshots`, JSON.stringify(result.screenshotUrls));
      }
      
      setSubmitted(true);
      
      // Add success message or redirect
      // router.push(`/dashboard/orders/${result.order.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to submit order");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Order Submitted</h1>
        <Tabs value={orderProofTab} onValueChange={setOrderProofTab} className="w-full">
          <TabsList>
            <TabsTrigger value="pending">Order Proof Status</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          <TabsContent value="pending">
            <div className="mt-4">
              <div className="mb-4">Your order proof is pending review.</div>
              
              {/* Display uploaded screenshots */}
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-2">Order Screenshots</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {screenshotPreviews.filter(url => url).map((url, index) => (
                    <div key={index} className="relative border rounded-md overflow-hidden">
                      <div className="relative w-full h-48">
                        <Image 
                          src={url}
                          alt={`Order screenshot ${index + 1}`}
                          fill
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                      <div className="p-2 bg-gray-50 text-xs">
                        Screenshot {index + 1}
                      </div>
                    </div>
                  ))}
                  
                  {screenshotPreviews.filter(url => url).length === 0 && (
                    <div className="text-gray-500 italic">No screenshots submitted</div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="approved">
            <div className="mt-4">Your order proof has been approved.</div>
          </TabsContent>
          <TabsContent value="rejected">
            <div className="mt-4">Your order proof was rejected. Please contact support.</div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Show a loader only, not a white overlay, and just disable selection
  const isAnyLoading = brandsLoading || managersLoading || productsLoading;

  // For accessibility, set aria-busy on the form
  return (
    <div className="max-w-2xl mx-auto relative">
      {/* Impressive loader, not a white overlay */}
      {isAnyLoading && (
        <ImpressiveLoader
          text={
            brandsLoading
              ? "Loading brands..."
              : managersLoading
              ? "Loading managers..."
              : productsLoading
              ? "Loading products..."
              : "Loading..."
          }
        />
      )}
      
      {/* Fullscreen Order Submission Loader */}
      {submitting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center space-y-4 max-w-md w-full">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <h3 className="text-xl font-medium">Submitting Order</h3>
            <p className="text-muted-foreground text-center">
              {overallProgress < 40 && "Preparing your order..."}
              {overallProgress >= 40 && overallProgress < 70 && "Uploading screenshots to Cloudinary..."}
              {overallProgress >= 70 && overallProgress < 90 && "Processing your order..."}
              {overallProgress >= 90 && "Almost done!"}
            </p>
            <Progress value={overallProgress} className="w-full" />
          </div>
        </div>
      )}
      
      <h1 className="text-2xl font-bold mb-4">Add Order</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        aria-busy={isAnyLoading}
        style={isAnyLoading ? { pointerEvents: "none", opacity: 0.6, filter: "blur(0.5px)" } : {}}
      >
        <div>
          <label className="block mb-1 font-medium">Order ID</label>
          <Input
            {...register("order_id", { required: true })}
            placeholder="Order ID"
            disabled={isAnyLoading}
            type="text"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Date of Order</label>
          <Input
            type="date"
            {...register("date_of_order", { required: true })}
            value={todayDate}
            disabled
            readOnly
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Brand</label>
          <Controller
            name="brandId"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select
                onValueChange={value => {
                  field.onChange(value);
                  setSelectedBrand(Number(value));
                  setValue("managerId", "");
                }}
                value={field.value}
                disabled={brandsLoading || isAnyLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={brandsLoading ? "Loading brands..." : "Select brand"} />
                </SelectTrigger>
                <SelectContent>
                  {brandsLoading ? (
                    <div className="px-4 py-2 text-gray-500">Loading brands...</div>
                  ) : (
                    brands.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {/* Manager selector appears immediately after brand selector */}
        <div>
          <label className="block mb-1 font-medium">Manager (Mediator)</label>
          <Controller
            name="managerId"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select
                onValueChange={value => {
                  field.onChange(value);
                  setSelectedManager(Number(value));
                }}
                value={field.value}
                disabled={!selectedBrand || managersLoading || isAnyLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={managersLoading ? "Loading managers..." : "Select manager"} />
                </SelectTrigger>
                <SelectContent>
                  {managersLoading ? (
                    <div className="px-4 py-2 text-gray-500">Loading managers...</div>
                  ) : managers.length === 0 ? (
                    <div className="px-4 py-2 text-gray-500">No managers available</div>
                  ) : (
                    managers.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Product Order(s)</label>
          {fields.map((item, idx) => (
            <div key={item.id} className="flex flex-col gap-2 mb-6 border p-4 rounded-md">
              <div className="flex gap-2 mb-2">
                <Controller
                  name={`products.${idx}.name`}
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      disabled={products.length === 0 || productsLoading || isAnyLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={productsLoading ? "Loading products..." : "Select Product"} />
                      </SelectTrigger>
                      <SelectContent>
                        {productsLoading ? (
                          <div className="px-4 py-2 text-gray-500">Loading products...</div>
                        ) : products.length === 0 ? (
                          <div className="px-4 py-2 text-gray-500">No products available</div>
                        ) : (
                          products.map((p) => (
                            <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {fields.length > 1 && (
                  <Button type="button" variant="destructive" onClick={() => remove(idx)} disabled={isAnyLoading}>
                    Remove
                  </Button>
                )}
              </div>
              
              {/* Screenshot upload for this product */}
              <div className="mt-2">
                <Label htmlFor={`screenshot-${idx}`} className="block mb-1 font-medium">
                  Order Screenshot
                </Label>
                <Input
                  id={`screenshot-${idx}`}
                  type="file"
                  accept="image/*"
                  disabled={isAnyLoading}
                  {...register(`products.${idx}.screenshot`)}
                  onChange={(e) => handleFileChange(idx, e.target.files)}
                />
                
                {/* Upload progress bar */}
                {uploadProgress[idx] !== undefined && uploadProgress[idx] < 100 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress[idx]}%</span>
                    </div>
                    <Progress value={uploadProgress[idx]} className="w-full h-2" />
                  </div>
                )}
                
                {/* Preview area */}
                {screenshotPreviews[idx] && (
                  <div className="mt-2 relative w-full h-40 bg-gray-100 rounded-md overflow-hidden">
                    <Image 
                      src={screenshotPreviews[idx]} 
                      alt="Order screenshot preview" 
                      fill 
                      style={{ objectFit: 'contain' }} 
                    />
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => {
                        const newPreviews = [...screenshotPreviews];
                        newPreviews[idx] = '';
                        setScreenshotPreviews(newPreviews);
                        
                        // Also clear the file input and progress
                        setValue(`products.${idx}.screenshot`, null);
                        setUploadProgress(prev => {
                          const newProgress = {...prev};
                          delete newProgress[idx];
                          return newProgress;
                        });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => {
            append({ name: "", screenshot: null });
            // Extend screenshot previews array
            setScreenshotPreviews([...screenshotPreviews, '']);
          }} disabled={isAnyLoading}>
            + Add More Product
          </Button>
        </div>
        <div>
          <label className="block mb-1 font-medium">Deal Type</label>
          <Controller
            name="deal_type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} disabled={isAnyLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select deal type" />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_TYPES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Commission (if any)</label>
          <Input {...register("commission")} placeholder="Commission amount or leave blank" disabled={isAnyLoading} />
        </div>
        {dealType === "EXCHANGE" && (
          <div>
            <label className="block mb-1 font-medium">Product Required (for Exchange)</label>
            <Textarea {...register("exchange_product", { required: dealType === "EXCHANGE" })} placeholder="Describe required product" disabled={isAnyLoading} />
          </div>
        )}
        <div>
          <label className="block mb-1 font-medium">Campaign Type</label>
          <Controller
            name="campaign_type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} disabled={isAnyLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign type" />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_TYPES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {error && <div className="text-red-600 mt-2">{error}</div>}
        <Button 
          type="submit" 
          className="w-full mt-4" 
          disabled={isAnyLoading || submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Order"
          )}
        </Button>
      </form>
    </div>
  );
}
