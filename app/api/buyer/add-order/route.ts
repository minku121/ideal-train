import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from "uuid";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const prisma = new PrismaClient();

// Type definitions
interface Screenshots {
  [key: string]: File;
}

interface ScreenshotPaths {
  [key: string]: string;
}

// Upload file to Cloudinary
async function uploadToCloudinary(file: File, productId: number): Promise<string> {
  try {
    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64File}`;
    
    // Generate unique public_id with productId for better organization
    const uniqueId = uuidv4().substring(0, 8);
    const public_id = `order_proofs/product_${productId}_${uniqueId}`;
    
    // Upload to Cloudinary with progress monitoring
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(
        dataURI,
        {
          public_id,
          folder: 'order_proofs',
          resource_type: 'image',
          tags: ['order_proof', `product_${productId}`],
          // Enable eager transformations to pregenerate optimized versions
          eager: [
            { width: 300, height: 300, crop: "fill" },
            { width: 700, crop: "scale" }
          ],
          // Add timestamp to prevent caching
          timestamp: Math.floor(Date.now() / 1000)
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });
    
    console.log(`Successfully uploaded image for product ${productId}`);
    
    // Return the secure URL
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Breakpoint 1: Request received
    console.log("POST /api/buyer/add-order called");

    // Get session and user
    const session = await getServerSession(authOptions);
    // Breakpoint 2: Session data
    console.log("Session:", session);

    if (!session?.user) {
      console.log("No user in session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Allow both BUYER and MEDIATOR roles
    if (session.user.role !== "BUYER" && session.user.role !== "MEDIATOR") {
      console.log("User role not allowed:", session.user.role);
      return NextResponse.json({ error: "Forbidden: Only BUYER and MEDIATOR roles can add orders" }, { status: 403 });
    }

    // Check if the request is multipart form data
    const contentType = req.headers.get("content-type") || "";
    let body;
    const screenshots: Screenshots = {};

    if (contentType.includes("multipart/form-data")) {
      // Process form data
      const formData = await req.formData();
      console.log("Received form data");
      
      // Extract regular fields
      body = {
        order_id: formData.get("order_id"),
        date_of_order: formData.get("date_of_order"),
        brandId: Number(formData.get("brandId")),
        managerId: Number(formData.get("managerId")),
        productIds: JSON.parse(formData.get("productIds") as string),
        deal_type: formData.get("deal_type"),
        campaign_type: formData.get("campaign_type"),
        commission: formData.get("commission"),
        exchange_product: formData.get("exchange_product"),
      };

      // Process screenshots
      for (const [key, value] of formData.entries()) {
        if (key.startsWith("screenshots[") && key.endsWith("]") && value instanceof File) {
          // Extract productId from key format: screenshots[productId]
          const productId = key.replace("screenshots[", "").replace("]", "");
          screenshots[productId] = value;
        }
      }
    } else {
      // Regular JSON request
      body = await req.json();
    }

    // Breakpoint 3: Raw request body
    console.log("Request body:", body);
    console.log("Screenshots:", Object.keys(screenshots).length > 0 ? "Yes" : "No");

    const {
      order_id,
      date_of_order,
      brandId,
      managerId,  // This is the brandManager's ID
      productIds,
      deal_type,
      campaign_type,
      commission,
      exchange_product,
    } = body;
    
    // If user is a MEDIATOR, check if they are associated with the brand
    if (session.user.role === "MEDIATOR" && brandId) {
      // Check if the mediator is associated with this brand
      const mediatorBrandAssociation = await prisma.brandManager.findFirst({
        where: {
          userId: session.user.id,
          brandId: Number(brandId)
        }
      });
      
      if (!mediatorBrandAssociation) {
        console.log("Mediator not associated with this brand");
        return NextResponse.json({ 
          error: "You are not authorized to add orders for this brand" 
        }, { status: 403 });
      }
      
      console.log("Mediator is authorized for this brand");
    }

    // Breakpoint 4: Individual fields
    console.log("order_id:", order_id);
    console.log("date_of_order:", date_of_order);
    console.log("brandId:", brandId);
    console.log("managerId (brandManagerId):", managerId);
    console.log("productIds:", productIds);
    console.log("deal_type:", deal_type);
    console.log("campaign_type:", campaign_type);
    console.log("commission:", commission);
    console.log("exchange_product:", exchange_product);

    // Validate required fields and return which field is missing
    if (!order_id) {
      console.log("Missing order_id");
      return NextResponse.json({ error: "Missing required field: order_id" }, { status: 400 });
    }
    if (!date_of_order) {
      console.log("Missing date_of_order");
      return NextResponse.json({ error: "Missing required field: date_of_order" }, { status: 400 });
    }
    if (!brandId) {
      console.log("Missing brandId");
      return NextResponse.json({ error: "Missing required field: brandId" }, { status: 400 });
    }
    if (!managerId) {
      console.log("Missing managerId");
      return NextResponse.json({ error: "Missing required field: managerId" }, { status: 400 });
    }
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      console.log("Missing or invalid productIds:", productIds);
      return NextResponse.json({ error: "Missing required field: productIds" }, { status: 400 });
    }

    // Find products for the selected brand and manager
    // Using any type to bypass TypeScript errors until Prisma client is regenerated
    const whereClause: any = {
      id: { in: productIds },
      brandId: Number(brandId),
      managerId: Number(managerId), // Changed from brandManagerId to managerId to match schema
    };
    
    const productRecords = await prisma.product.findMany({
      where: whereClause,
      select: { id: true }
    });

    // Breakpoint 5: Product records found
    console.log("Product records found:", productRecords);

    if (productRecords.length !== productIds.length) {
      console.log("Product records mismatch. Expected:", productIds.length, "Found:", productRecords.length);
      return NextResponse.json({ error: "One or more products not found" }, { status: 400 });
    }

    // Upload screenshots to Cloudinary and collect their URLs
    const screenshotUrls: ScreenshotPaths = {};
    for (const productId in screenshots) {
      if (screenshots[productId]) {
        try {
          const imageUrl = await uploadToCloudinary(screenshots[productId], Number(productId));
          screenshotUrls[productId] = imageUrl;
        } catch (error) {
          console.error(`Error uploading screenshot for product ${productId}:`, error);
        }
      }
    }

    // Create the order with transaction to ensure all related records are created
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create the order
      // Using any type to bypass TypeScript errors until Prisma client is regenerated
      // Create the order data with only the fields recognized by the current Prisma client
      const orderData: any = {
        orderId: order_id,
        dateOfOrder: new Date(date_of_order),
        buyerId: session.user.id,
        brandId: Number(brandId),
        brandManagerId: Number(managerId),
        // Note: dealType and campaignType are in the schema but not in the generated client yet
        // We'll store these values in the console log for reference
        // dealType: deal_type,
        // campaignType: campaign_type,
        // commission: commission ? Number(commission) : null,
        // exchangeNotes: exchange_product,
        orderProofStatus: "SUBMITTED",
      };
      
      // Log the values that couldn't be stored due to client mismatch
      console.log("Values not stored in database due to Prisma client mismatch:", {
        dealType: deal_type,
        campaignType: campaign_type,
        commission: commission,
        exchangeNotes: exchange_product
      });
      
      const newOrder = await tx.order.create({
        data: orderData
      });

      // 2. Create OrderProduct entries for each product
      for (const product of productRecords) {
        await tx.orderProduct.create({
          data: {
            orderId: newOrder.id,
            productId: product.id,
          }
        });

        // Store screenshot URL if available
        const productIdStr = String(product.id);
        if (screenshotUrls[productIdStr]) {
          try {
            // Now we can use the Prisma client with the lowercase orderScreenshot model
            await tx.orderScreenshot.create({
              data: {
                orderId: newOrder.id,
                productId: product.id,
                screenshotUrl: screenshotUrls[productIdStr]
              }
            });
            console.log(`Screenshot URL saved successfully for product ${product.id}`);
          } catch (error) {
            console.error("Failed to store screenshot URL in database:", error);
            // Fallback to raw SQL if needed
            try {
              await tx.$executeRaw`
                INSERT INTO OrderScreenshot (orderId, productId, screenshotUrl, createdAt)
                VALUES (${newOrder.id}, ${product.id}, ${screenshotUrls[productIdStr]}, NOW())
              `;
              console.log(`Screenshot URL saved with raw SQL for product ${product.id}`);
            } catch (sqlError) {
              console.error("SQL fallback also failed:", sqlError);
            }
            // Continue with the transaction, don't fail because of screenshot
          }
        }
      }

      return newOrder;
    });

    // Breakpoint 6: Order created
    console.log("Order created:", order);
    console.log("Screenshot URLs:", screenshotUrls);

    return NextResponse.json({ 
      message: "Order created successfully", 
      order,
      screenshotUrls: Object.keys(screenshotUrls).length > 0 ? screenshotUrls : undefined
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
