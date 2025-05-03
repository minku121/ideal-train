import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Check session and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in" },
        { status: 401 }
      );
    }

    // Only ADMIN and MEDIATOR roles can view all products
    if (session.user.role !== "ADMIN" && session.user.role !== "MEDIATOR") {
      return NextResponse.json(
        { error: "Forbidden: Only ADMIN and MEDIATOR roles can view products" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const brandId = searchParams.get('brandId') ? parseInt(searchParams.get('brandId')!) : undefined;
    const managerId = searchParams.get('managerId') ? parseInt(searchParams.get('managerId')!) : undefined;
    
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const whereClause: any = {};
    
    // If brandId filter is provided
    if (brandId) {
      whereClause.brandId = brandId;
    }
    
    // If managerId filter is provided
    if (managerId) {
      whereClause.managerId = managerId;
    }
    
    // If MEDIATOR, only show products they manage
    if (session.user.role === "MEDIATOR") {
      const mediatorId = session.user.id;
      
      // Get all brands the mediator manages
      const managedBrands = await prisma.brandManager.findMany({
        where: { userId: mediatorId },
        select: { brandId: true }
      });
      
      const brandIds = managedBrands.map(b => b.brandId);
      
      // If mediator has no brands, return empty
      if (brandIds.length === 0) {
        return NextResponse.json({
          products: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0
          }
        });
      }
      
      // Filter by brands the mediator manages
      whereClause.brandId = { in: brandIds };
    }

    // Get products with filtering
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        brand: {
          select: {
            name: true
          }
        },
        manager: {
          select: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        orderProducts: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Count number of orders per product
    const enhancedProducts = products.map(product => ({
      ...product,
      orderCount: product.orderProducts ? product.orderProducts.length : 0
    }));

    // Get total count for pagination
    const totalProducts = await prisma.product.count({
      where: whereClause
    });

    return NextResponse.json({
      products: enhancedProducts,
      pagination: {
        total: totalProducts,
        page,
        limit,
        totalPages: Math.ceil(totalProducts / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Add a new product
export async function POST(req: NextRequest) {
  try {
    // Check session and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only ADMIN can add products" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validate required fields
    const {
      name,
      brandId,
      dealType,
      campaignType,
      managerId,
      commission,
      exchangeNotes
    } = body;

    // Check for missing fields
    if (!name || !brandId || !dealType || !campaignType || !managerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate enums
    const validDealTypes = ["ORIGINAL", "EMPTY", "EXCHANGE"];
    const validCampaignTypes = ["RATING_DEAL", "REVIEW_DEAL", "ORDER_ONLY_DEAL"];

    if (!validDealTypes.includes(dealType)) {
      return NextResponse.json(
        { error: "Invalid dealType" },
        { status: 400 }
      );
    }

    if (!validCampaignTypes.includes(campaignType)) {
      return NextResponse.json(
        { error: "Invalid campaignType" },
        { status: 400 }
      );
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        brandId: Number(brandId),
        managerId: Number(managerId),
        dealType,
        campaignType,
        commission: commission ? Number(commission) : null,
        exchangeNotes
      },
      include: {
        brand: {
          select: {
            name: true
          }
        },
        manager: {
          select: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: "Product created successfully",
      product
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 