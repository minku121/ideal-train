import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { OrderProofStatus } from "@prisma/client";

// GET /api/admin/analytics
export async function GET() {
  try {
    // Check session and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in" },
        { status: 401 }
      );
    }

    // Only ADMIN role can access this endpoint
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only ADMIN role can access this endpoint" },
        { status: 403 }
      );
    }

    // Get total counts
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      revenueData,
      usersByRole,
      recentUsers,
      productsByDealType,
      ordersByProofStatus,
      // The raw SQL query for monthly data has been removed due to compatibility issues
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Total products
      prisma.product.count(),
      
      // Total orders
      prisma.order.count(),
      
      // Total commission (using sum of commission field)
      prisma.order.aggregate({
        _sum: {
          commission: true
        },
        where: {
          orderProofStatus: OrderProofStatus.APPROVED
        }
      }),
      
      // Users by role
      prisma.user.groupBy({
        by: ["role"],
        _count: {
          id: true
        }
      }),
      
      // Recent users
      prisma.user.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc"
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      }),
      
      // Products by deal type
      prisma.product.groupBy({
        by: ["dealType"],
        _count: {
          id: true
        }
      }),
      
      // Orders by status
      prisma.order.groupBy({
        by: ["orderProofStatus"],
        _count: {
          id: true
        }
      }),
    ]);

    // Get monthly data for charts (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyOrders = await prisma.order.groupBy({
      by: ["dateOfOrder"],
      _count: {
        id: true
      },
      where: {
        dateOfOrder: {
          gte: sixMonthsAgo
        }
      }
    });
    
    const monthlyUsers = await prisma.user.groupBy({
      by: ["createdAt"],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      }
    });

    // Calculate growth percentages (this would typically compare to previous period)
    // For this example, we're using static growth values
    const userGrowth = 12;
    const productGrowth = 8;
    const orderGrowth = 19;
    const revenueGrowth = 7;

    return NextResponse.json({
      summary: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: revenueData._sum.commission || 0,
        userGrowth,
        productGrowth,
        orderGrowth,
        revenueGrowth
      },
      details: {
        usersByRole,
        recentUsers,
        productsByDealType,
        ordersByProofStatus
      },
      charts: {
        monthlyOrders,
        monthlyUsers
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
} 