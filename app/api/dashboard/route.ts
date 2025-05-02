import { authOptions } from "@/app/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;

  switch (role) {
    case "ADMIN":
      const [users, products, orders] = await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.order.count()
      ]);
      
      // Calculate revenue from all orders
      const allOrders = await prisma.order.findMany({
        include: {
          products: true
        }
      });
      
      const revenue = allOrders.reduce((total, order) => {
        const orderTotal = order.products.reduce((sum, product) => {
          return sum + (product.commission || 0);
        }, 0);
        return total + orderTotal;
      }, 0);

      return NextResponse.json({ 
        users,
        products,
        orders,
        revenue: parseFloat(revenue.toFixed(2)) // Round to 2 decimal places
      });

    case "BUYER":
      const buyerId = session.user.id;
      const [totalOrders, approvedOrders, rejectedOrders, pendingOrders] = await Promise.all([
        prisma.order.count({ where: { buyerId } }),
        prisma.order.count({ 
          where: { 
            buyerId,
            orderProofStatus: "APPROVED" 
          } 
        }),
        prisma.order.count({ 
          where: { 
            buyerId,
            orderProofStatus: "REJECTED" 
          } 
        }),
        prisma.order.count({ 
          where: { 
            buyerId,
            orderProofStatus: "SUBMITTED" 
          } 
        })
      ]);
      
      return NextResponse.json({ 
        totalOrders,
        approvedOrders,
        rejectedOrders,
        pendingOrders
      });

    case "SELLER":
      const sellerId = session.user.id;
      const [sellerProducts, sellerOrders] = await Promise.all([
        prisma.product.count({
          where: { managerId: sellerId }
        }),
        prisma.order.count({
          where: { products: { some: { managerId: sellerId } } }
        })
      ]);
      return NextResponse.json({
        products: sellerProducts,
        orders: sellerOrders
      });

    case "MEDIATOR":
      const [mediatorTotalOrders, mediatorPendingOrders] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({
          where: { orderProofStatus: "SUBMITTED" }
        })
      ]);
      return NextResponse.json({
        totalOrders: mediatorTotalOrders,
        pendingOrders: mediatorPendingOrders
      });

    default:
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}
