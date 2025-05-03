import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/admin/brands - Get all brands
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }
    
    const brands = await prisma.brand.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(brands);
    
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

// POST /api/admin/brands - Create a new brand
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }
    
    const body = await req.json();
    
    // Validate request body
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
    }
    
    // Check if brand with this name already exists
    const existingBrand = await prisma.brand.findFirst({
      where: {
        name: body.name
      }
    });
    
    if (existingBrand) {
      return NextResponse.json({ error: "A brand with this name already exists" }, { status: 409 });
    }
    
    // Create new brand
    const brand = await prisma.brand.create({
      data: {
        name: body.name
      }
    });
    
    // Log creation action to console instead of database
    console.log(`Brand created: ${brand.name} by user ID: ${session.user.id}`);
    
    return NextResponse.json({ 
      message: "Brand created successfully",
      brand
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error creating brand:", error);
    return NextResponse.json(
      { error: "Failed to create brand" },
      { status: 500 }
    );
  }
} 