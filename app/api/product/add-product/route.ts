import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

const prisma = new PrismaClient();

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
        { error: "Forbidden: Only admin can add product" },
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

    // Check for missing fields and log which one is missing
    const requiredFields = [
      { key: "name", value: name },
      { key: "brandId", value: brandId },
      { key: "dealType", value: dealType },
      { key: "campaignType", value: campaignType },
      { key: "managerId", value: managerId }
    ];

    const missingField = requiredFields.find(field => !field.value);

    if (missingField) {
      console.error(`Missing required field: ${missingField.key}`);
      return NextResponse.json(
        { error: `Missing required field: ${missingField.key}` },
        { status: 400 }
      );
    }

    // Validate enums
    const validDealTypes = ["ORIGINAL", "EMPTY", "EXCHANGE"];
    const validCampaignTypes = [
      "RATING_DEAL",
      "REVIEW_DEAL",
      "ORDER_ONLY_DEAL"
    ];

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
        dealType,
        campaignType,
        managerId: Number(managerId),
        commission: commission !== undefined ? Number(commission) : null,
        exchangeNotes: exchangeNotes || null
      }
    });

    return NextResponse.json(
      { message: "Product added successfully", product },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
