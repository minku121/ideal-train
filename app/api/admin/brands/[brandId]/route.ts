import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PATCH /api/admin/brands/[brandId] - Update a brand
export async function PATCH(
  req: NextRequest,
  { params }: { params: { brandId: string } }
) {
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
    
    const brandId = parseInt(params.brandId);
    
    if (isNaN(brandId)) {
      return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });
    }
    
    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id: brandId }
    });
    
    if (!existingBrand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
    
    const body = await req.json();
    
    // Validate request body
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
    }
    
    // Check if another brand with this name already exists
    const nameConflict = await prisma.brand.findFirst({
      where: {
        name: body.name,
        id: { not: brandId }
      }
    });
    
    if (nameConflict) {
      return NextResponse.json({ error: "Another brand with this name already exists" }, { status: 409 });
    }
    
    // Update brand
    const updatedBrand = await prisma.brand.update({
      where: { id: brandId },
      data: { name: body.name }
    });
    
    // Log update action to console instead of database
    console.log(`Brand updated: ${existingBrand.name} → ${updatedBrand.name} by user ID: ${session.user.id}`);
    
    return NextResponse.json({ 
      message: "Brand updated successfully",
      brand: updatedBrand
    });
    
  } catch (error) {
    console.error("Error updating brand:", error);
    return NextResponse.json(
      { error: "Failed to update brand" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/brands/[brandId] - Delete a brand
export async function DELETE(
  req: NextRequest,
  { params }: { params: { brandId: string } }
) {
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
    
    const brandId = parseInt(params.brandId);
    
    if (isNaN(brandId)) {
      return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });
    }
    
    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id: brandId }
    });
    
    if (!existingBrand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
    
    // Check if brand has associated products
    const productsCount = await prisma.product.count({
      where: { brandId }
    });
    
    // Delete brand
    await prisma.brand.delete({
      where: { id: brandId }
    });
    
    // Log deletion action to console instead of database
    console.log(`Brand deleted: ${existingBrand.name} (had ${productsCount} associated products) by user ID: ${session.user.id}`);
    
    return NextResponse.json({ 
      message: "Brand deleted successfully"
    });
    
  } catch (error) {
    console.error("Error deleting brand:", error);
    return NextResponse.json(
      { error: "Failed to delete brand" },
      { status: 500 }
    );
  }
} 