import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import Image from "next/image";
import { ClipboardCopy, ImageIcon, User, DollarSign, Calendar, ShoppingBag, Building, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface OrderType {
  id: number;
  orderId: string;
  dateOfOrder: string;
  createdAt: string;
  orderProofStatus: string;
  exchangeNotes?: string;
  upiId?: string;
  brand: { name: string };
  buyer: { 
    name: string; 
    email: string;
    role?: string;
    createdAt?: string;
    settings?: {
      upiId?: string;
    } 
  };
  brandManager: { 
    user: { 
      name: string; 
      email: string 
    } 
  };
  orderProducts: Array<{
    product: {
      id: number;
      name: string;
      dealType: string;
      campaignType: string;
    }
  }>;
  orderScreenshots: Array<{
    productId: number;
    screenshotUrl: string;
  }>;
}

interface OrderDetailsDialogProps {
  order: OrderType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
  if (!order) return null;
  
  // Helper function to get status badge styling
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
  
  // Helper function to format dates safely
  const formatDateSafe = (dateString: string | undefined, formatStr: string = "PPP") => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), formatStr);
    } catch (err) {
      return "Invalid date";
    }
  };
  
  // Function to copy text to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details #{order.orderId}</span>
            <Badge className={getStatusBadgeClass(order.orderProofStatus)}>
              {order.orderProofStatus}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="customer">Customer Details</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="payment">Payment Info</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Order Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID:</span>
                    <div className="flex items-center">
                      <span className="font-mono">{order.orderId}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 ml-1"
                        onClick={() => copyToClipboard(order.orderId, "Order ID")}
                      >
                        <ClipboardCopy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{format(new Date(order.dateOfOrder), "PPP")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span>{format(new Date(order.dateOfOrder), "p")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{format(new Date(order.createdAt), "PPP p")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={getStatusBadgeClass(order.orderProofStatus)}>
                      {order.orderProofStatus}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Organization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brand:</span>
                    <span className="font-medium">{order.brand.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brand Manager:</span>
                    <span>{order.brandManager.user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Manager Email:</span>
                    <div className="flex items-center">
                      <span className="font-mono">{order.brandManager.user.email}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 ml-1"
                        onClick={() => copyToClipboard(order.brandManager.user.email, "Email")}
                      >
                        <ClipboardCopy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Rejection reason if applicable */}
            {order.orderProofStatus === "REJECTED" && order.exchangeNotes && (
              <Card className="border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-700">Rejection Reason</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700">{order.exchangeNotes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Customer Details Tab */}
          <TabsContent value="customer" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{order.buyer?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <div className="flex items-center">
                    <span className="font-mono">{order.buyer?.email || "N/A"}</span>
                    {order.buyer?.email && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 ml-1"
                        onClick={() => copyToClipboard(order.buyer.email, "Email")}
                      >
                        <ClipboardCopy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                {order.buyer?.role && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role:</span>
                    <span>{order.buyer.role}</span>
                  </div>
                )}
                {order.buyer?.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer Since:</span>
                    <span>{formatDateSafe(order.buyer.createdAt)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Optional section if buyer has extended details */}
            {(order.buyer?.role || order.buyer?.createdAt) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Additional Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground italic">
                    More customer details available through the API if needed.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Order Products
                </CardTitle>
                <CardDescription>
                  Products included in this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {order.orderProducts.map((op: any, index: number) => {
                    const screenshotUrl = order.orderScreenshots.find(
                      (s: any) => s.productId === op.product.id
                    )?.screenshotUrl;
                    
                    return (
                      <li key={index} className="py-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{op.product.name}</p>
                          <div className="text-xs text-muted-foreground mt-1">
                            <span>
                              {op.product.dealType} • {op.product.campaignType}
                            </span>
                          </div>
                        </div>
                        
                        {screenshotUrl ? (
                          <Dialog>
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
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex items-center space-x-1"
                            >
                              <ImageIcon className="h-4 w-4 mr-1" />
                              <span>Screenshot</span>
                            </Button>
                          </Dialog>
                        ) : (
                          <span className="text-sm text-muted-foreground">No screenshot</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Payment Info Tab */}
          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {/* Only show UPI ID */}
                <div>
                  <span className="text-muted-foreground">UPI ID:</span>
                  <span className="float-right">
                    {order.buyer?.settings?.upiId || order.upiId || "Not provided"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default OrderDetailsDialog; 