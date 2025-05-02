import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Get user session to check role
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId query parameter is required" },
        { status: 400 }
      );
    }

    // Different query based on user role
    if (session.user.role === "MEDIATOR") {
      // Check if mediator is associated with this brand
      const mediatorBrandAssociation = await prisma.brandManager.findFirst({
        where: {
          userId: session.user.id,
          brandId: Number(brandId)
        }
      });
      
      if (!mediatorBrandAssociation) {
        return NextResponse.json(
          { error: "You are not authorized to view managers for this brand" },
          { status: 403 }
        );
      }
    }
    
    // Get managers for the brand
    const brandManagersData = await prisma.brandManager.findMany({
      where: {
        brandId: Number(brandId),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        user: {
          name: "asc"
        }
      }
    });

    // Format the response
    const managers = brandManagersData.map(manager => ({
      id: manager.id,
      name: manager.user.name,
      userId: manager.user.id,
      role: manager.user.role
    }));

    return NextResponse.json(managers);
  } catch (error) {
    console.error("Error fetching managers:", error);
    return NextResponse.json(
      { error: "Failed to fetch managers" },
      { status: 500 }
    );
  }
}
