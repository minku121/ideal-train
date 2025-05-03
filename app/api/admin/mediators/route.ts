import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

const prisma = new PrismaClient();

// Get all mediators (users with MEDIATOR role)
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

    // Only ADMIN can list all mediators
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only ADMIN can view all mediators" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const brandId = searchParams.get('brandId') ? parseInt(searchParams.get('brandId')!) : undefined;
    
    const skip = (page - 1) * limit;

    // Find all users with MEDIATOR role
    const mediators = await prisma.user.findMany({
      where: {
        role: "MEDIATOR",
        ...(brandId && {
          brandManagers: {
            some: {
              brandId
            }
          }
        })
      },
      include: {
        // Include brand associations
        brandManagers: {
          include: {
            brand: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get total count for pagination
    const totalMediators = await prisma.user.count({
      where: {
        role: "MEDIATOR",
        ...(brandId && {
          brandManagers: {
            some: {
              brandId
            }
          }
        })
      }
    });

    return NextResponse.json({
      mediators,
      pagination: {
        total: totalMediators,
        page,
        limit,
        totalPages: Math.ceil(totalMediators / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching mediators:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Assign mediator to brand
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

    // Only ADMIN can assign mediators to brands
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only ADMIN can assign mediators to brands" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { mediatorId, brandId } = body;

    if (!mediatorId || !brandId) {
      return NextResponse.json(
        { error: "Missing required fields: mediatorId and brandId" },
        { status: 400 }
      );
    }

    // Verify user exists and is a MEDIATOR
    const user = await prisma.user.findUnique({
      where: { id: Number(mediatorId) }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Mediator not found" },
        { status: 404 }
      );
    }

    if (user.role !== "MEDIATOR") {
      return NextResponse.json(
        { error: "User is not a MEDIATOR" },
        { status: 400 }
      );
    }

    // Verify brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: Number(brandId) }
    });

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    // Check if association already exists
    const existingAssociation = await prisma.brandManager.findFirst({
      where: {
        userId: Number(mediatorId),
        brandId: Number(brandId)
      }
    });

    if (existingAssociation) {
      return NextResponse.json(
        { message: "Mediator is already assigned to this brand", existingAssociation },
        { status: 200 }
      );
    }

    // Create association
    const brandManager = await prisma.brandManager.create({
      data: {
        userId: Number(mediatorId),
        brandId: Number(brandId)
      },
      include: {
        brand: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      message: "Mediator assigned to brand successfully",
      brandManager
    }, { status: 201 });
  } catch (error) {
    console.error("Error assigning mediator to brand:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 