import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check session and admin/mediator role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in" },
        { status: 401 }
      );
    }

    // Only ADMIN and MEDIATOR roles can list all buyers
    if (session.user.role !== "ADMIN" && session.user.role !== "MEDIATOR") {
      return NextResponse.json(
        { error: "Forbidden: Only ADMIN and MEDIATOR roles can view all buyers" },
        { status: 403 }
      );
    }

    const buyers = await prisma.user.findMany({
      where: {
        role: "BUYER"
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(buyers);
  } catch (error) {
    console.error("Error fetching buyers:", error);
    return NextResponse.json(
      { error: "Failed to fetch buyers" },
      { status: 500 }
    );
  }
} 