import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

const prisma = new PrismaClient();

// Get seller's products
export async function GET() {
  try {
    // Check session and seller role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in" },
        { status: 401 }
      );
    }

    // Only SELLER role can access this endpoint
    if (session.user.role !== "SELLER") {
      return NextResponse.json(
        { error: "Forbidden: Only SELLER role can access this endpoint" },
        { status: 403 }
      );
    }

    const sellerId = session.user.id;

    const products = await prisma.product.findMany({
      where: {
        managerId: sellerId
      },
      include: {
        brand: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching seller products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// Add a new product as a seller
export async function POST(req: NextRequest) {
  try {
    // Check session and seller role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in" },
        { status: 401 }
      );
    }

    // Only SELLER role can add products
    if (session.user.role !== "SELLER") {
      return NextResponse.json(
        { error: "Forbidden: Only SELLER role can add products" },
        { status: 403 }
      );
    }

    const sellerId = session.user.id;
    const body = await req.json();

    // Validate required fields
    const {
      name,
      brandId,
      dealType,
      campaignType,
      commission,
      exchangeNotes
    } = body;

    // Check for missing fields
    if (!name || !brandId || !dealType || !campaignType) {
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

    // Create product with the seller as the manager
    const product = await prisma.product.create({
      data: {
        name,
        brandId: Number(brandId),
        managerId: sellerId, // Use the seller's ID as the manager
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