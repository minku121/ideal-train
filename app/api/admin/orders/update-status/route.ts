import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

const prisma = new PrismaClient();

// This API route allows admins to approve or reject order proofs
export async function PATCH(req: NextRequest) {
  try {
    // Check session and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in" },
        { status: 401 }
      );
    }

    // Only ADMIN and MEDIATOR roles can update order status
    if (session.user.role !== "ADMIN" && session.user.role !== "MEDIATOR") {
      return NextResponse.json(
        { error: "Forbidden: Only ADMIN and MEDIATOR roles can update order status" },
        { status: 403 }
      );
    }

    // Get request body
    const body = await req.json();
    const { orderId, status, notes } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing required field: orderId" },
        { status: 400 }
      );
    }

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Status must be either APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    // If MEDIATOR, verify they are associated with the order's brand
    if (session.user.role === "MEDIATOR") {
      const order = await prisma.order.findUnique({
        where: { id: Number(orderId) },
        select: { brandId: true, brandManagerId: true }
      });

      if (!order) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }

      // Check if mediator is associated with this brand or is the assigned manager
      const mediatorBrandAssociation = await prisma.brandManager.findFirst({
        where: {
          userId: session.user.id,
          brandId: order.brandId
        }
      });

      if (!mediatorBrandAssociation && order.brandManagerId !== session.user.id) {
        return NextResponse.json(
          { error: "You are not authorized to update this order" },
          { status: 403 }
        );
      }
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        orderProofStatus: status,
        // Store rejection notes if provided and status is REJECTED
        ...(status === "REJECTED" && notes && { exchangeNotes: notes })
      },
      include: {
        brand: {
          select: { name: true }
        },
        orderProducts: {
          include: {
            product: {
              select: { name: true }
            }
          }
        }
      }
    });

    // Log the action
    console.log(`Order ${orderId} status updated to ${status} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: `Order has been ${status.toLowerCase()}`,
      order: updatedOrder
    });

  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
} 