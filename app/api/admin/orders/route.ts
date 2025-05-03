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

    if (session.user.role !== "ADMIN" && session.user.role !== "MEDIATOR") {
      return NextResponse.json(
        { error: "Forbidden: Only ADMIN and MEDIATOR roles can view all orders" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || undefined; // Filter by status
    const brandId = searchParams.get('brandId') ? parseInt(searchParams.get('brandId')!) : undefined;
    const buyerId = searchParams.get('buyerId') ? parseInt(searchParams.get('buyerId')!) : undefined;
    
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const whereClause: any = {};
    
    // If status filter is provided
    if (status) {
      whereClause.orderProofStatus = status;
    }
    
    // If brandId filter is provided
    if (brandId) {
      whereClause.brandId = brandId;
    }
    
    // If buyerId filter is provided
    if (buyerId) {
      whereClause.buyerId = buyerId;
    }
    
    // If MEDIATOR, only show orders for brands they manage
    if (session.user.role === "MEDIATOR") {
      const managedBrands = await prisma.brandManager.findMany({
        where: { userId: session.user.id },
        select: { brandId: true }
      });
      
      const brandIds = managedBrands.map(b => b.brandId);
      
      // If mediator has no brands, return empty
      if (brandIds.length === 0) {
        return NextResponse.json({
          orders: [],
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

    // Get orders with filtering
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        brand: {
          select: {
            name: true
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            settings: {
              select: {
                upiId: true
              }
            }
          }
        },
        brandManager: {
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
          include: {
            product: {
              select: {
                id: true,
                name: true,
                dealType: true,
                campaignType: true
              }
            }
          }
        },
        orderScreenshots: {
          select: {
            productId: true,
            screenshotUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalOrders = await prisma.order.count({
      where: whereClause
    });

    return NextResponse.json({
      orders,
      pagination: {
        total: totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 