"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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

export default function AddOrderPage() {
  const router = useRouter();
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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || '{}');
    if (!user || user.role !== "BUYER") {
      router.replace("/dashboard");
    }
  }, [router]);

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
      products: [{ name: "" }],
      deal_type: "ORIGINAL",
      commission: "",
      exchange_product: "",
      campaign_type: "RATING_DEAL",
      managerId: "",
    },
  });

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

    // Compose payload according to schema.prisma and API expectations
    // - order_id: string
    // - date_of_order: string (date)
    // - brandId: number
    // - managerId: number
    // - productIds: number[]
    // - deal_type: DealType (enum, uppercase)
    // - campaign_type: CampaignType (enum, uppercase, underscores)
    // - commission: float (optional)
    // - exchange_product: string (optional, for EXCHANGE)
    const user = JSON.parse(localStorage.getItem("user") || '{}');
    if (!user || !user.id) {
      setError("User not authenticated");
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

    // Compose productIds array by matching selected product names to their IDs
    const productIds = (data.products || [])
      .map((p: any) => {
        const found = products.find(prod => prod.name === p.name);
        return found ? found.id : null;
      })
      .filter((id: number | null) => id !== null);

    // Compose payload
    const payload = {
      order_id: data.order_id,
      date_of_order: todayDate, // Always use today's date
      brandId: Number(brandId),
      managerId: Number(managerId),
      productIds, // <-- send productIds instead of products
      deal_type: (data.deal_type || "ORIGINAL").toUpperCase(),
      campaign_type: (data.campaign_type || "RATING_DEAL").toUpperCase().replace(/ /g, "_"),
      commission: data.commission ? String(data.commission) : undefined,
      exchange_product: data.exchange_product || undefined,
    };

    try {
      await addOrderApi(payload);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to submit order");
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
            <div className="mt-4">Your order proof is pending review.</div>
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
            <div key={item.id} className="flex gap-2 mb-2">
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
          ))}
          <Button type="button" variant="secondary" onClick={() => append({ name: "" })} disabled={isAnyLoading}>
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
        <Button type="submit" className="w-full mt-4" disabled={isAnyLoading}>Submit Order</Button>
      </form>
    </div>
  );
}
