import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Get user session to check role
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brandId");
    const managerId = searchParams.get("managerId"); // This is brandManagerId in our schema
    const name = searchParams.get("name");
    const includeDetails = searchParams.get("includeDetails") === "true";

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId query parameter is required" },
        { status: 400 }
      );
    }

    // If user is a MEDIATOR, check if they are associated with this brand
    if (session.user.role === "MEDIATOR") {
      const mediatorBrandAssociation = await prisma.brandManager.findFirst({
        where: {
          userId: session.user.id,
          brandId: Number(brandId)
        }
      });
      
      if (!mediatorBrandAssociation) {
        return NextResponse.json(
          { error: "You are not authorized to view products for this brand" },
          { status: 403 }
        );
      }
      
      // If managerId is provided, make sure it belongs to this mediator
      if (managerId && Number(managerId) !== mediatorBrandAssociation.id) {
        return NextResponse.json(
          { error: "You are not authorized to view products for this manager" },
          { status: 403 }
        );
      }
    }

    // Build where clause
    const where: any = {
      brandId: Number(brandId),
    };

    // Add managerId filter if provided
    if (managerId) {
      where.managerId = Number(managerId);
    }

    // Add name filter if provided
    if (name) {
      where.name = {
        contains: name,
      };
    }

    // Query products with basic information
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        // Always include dealType and campaignType as they are required fields in the schema
        dealType: true,
        campaignType: true,
        ...(includeDetails ? {
          commission: true,
          brandId: true,
          managerId: true,
          exchangeNotes: true
        } : {})
      },
      orderBy: {
        name: "asc",
      },
    });

    // If details are requested, get additional information separately
    if (includeDetails && products.length > 0) {
      // Get all unique brandIds and managerIds
      const brandIds = [...new Set(products.map(p => p.brandId))]; 
      const managerIds = [...new Set(products.map(p => p.managerId))]; 
      
      // Fetch brands and managers in bulk
      const brands = await prisma.brand.findMany({
        where: { id: { in: brandIds } },
        select: { id: true, name: true }
      });
      
      const brandManagers = await prisma.brandManager.findMany({
        where: { id: { in: managerIds } },
        include: { user: { select: { id: true, name: true } } }
      });
      
      // Create lookup maps
      const brandMap = new Map(brands.map(b => [b.id, b.name]));
      const managerMap = new Map(brandManagers.map(bm => [bm.id, bm.user?.name || 'Unknown']));
      
      // Enhance products with additional information
      const formattedProducts = products.map(product => ({
        id: product.id,
        name: product.name,
        dealType: product.dealType,
        campaignType: product.campaignType,
        commission: product.commission,
        exchangeNotes: product.exchangeNotes,
        brandId: product.brandId,
        managerId: product.managerId,
        brandName: brandMap.get(product.brandId) || 'Unknown',
        managerName: managerMap.get(product.managerId) || 'Unknown'
      }));
      
      return NextResponse.json(formattedProducts);
    }
    
    // Return basic product information
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
