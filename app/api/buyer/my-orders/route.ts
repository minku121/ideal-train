import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Get session and user
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Get orders for the current user
    const orders = await prisma.order.findMany({
      where: {
        buyerId: session.user.id
      },
      include: {
        brand: {
          select: {
            name: true
          }
        },
        brandManager: {
          select: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        orderProducts: {
          include: {
            product: {
              select: {
                name: true,
                id: true
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
      where: {
        buyerId: session.user.id
      }
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
