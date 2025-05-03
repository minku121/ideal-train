import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// Define valid log levels matching Prisma schema
type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";

// Create a simple logger for use within this route
const routeLogger = {
  async log(level: LogLevel, message: string, metadata: any = {}) {
    try {
      await prisma.appLog.create({
        data: {
          level,
          message,
          source: metadata.source || "api-logs",
          userId: metadata.userId,
          metadata: metadata
        }
      });
    } catch (error) {
      console.error("Failed to create log entry:", error);
    }
  },
  async debug(message: string, metadata = {}) {
    return this.log("DEBUG", message, metadata);
  },
  async info(message: string, metadata = {}) {
    return this.log("INFO", message, metadata);
  },
  async warning(message: string, metadata = {}) {
    return this.log("WARNING", message, metadata);
  },
  async error(message: string, metadata = {}) {
    return this.log("ERROR", message, metadata);
  },
  async critical(message: string, metadata = {}) {
    return this.log("CRITICAL", message, metadata);
  }
};

interface LogFilter {
  level?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

// GET /api/admin/logs - Get application logs with filtering
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in" },
        { status: 401 }
      );
    }

    // Verify admin role
    if (session.user.role !== "ADMIN") {
      // Log unauthorized access attempt
      await routeLogger.warning("Unauthorized access attempt to logs API", {
        source: "admin-logs-api",
        userId: session.user.id,
        metadata: { role: session.user.role }
      });
      
      return NextResponse.json(
        { error: "Forbidden: Only admins can access logs" },
        { status: 403 }
      );
    }

    // Extract query parameters for filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    
    const filters: LogFilter = {
      level: searchParams.get("level") || undefined,
      source: searchParams.get("source") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 50 : limit
    };

    // Set up pagination
    const skip = (filters.page - 1) * filters.limit;
    const take = Math.min(100, Math.max(10, filters.limit)); // Min 10, max 100

    // Build where clause for Prisma
    const where: any = {};
    
    if (filters.level) {
      where.level = filters.level as LogLevel;
    }
    
    if (filters.source) {
      where.source = {
        contains: filters.source
      };
    }
    
    if (filters.startDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(filters.startDate)
      };
    }
    
    if (filters.endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(filters.endDate)
      };
    }

    // Get logs with proper Prisma queries
    const [logs, totalCount] = await Promise.all([
      prisma.appLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take
      }),
      prisma.appLog.count({ where })
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / filters.limit);
    const hasNextPage = filters.page < totalPages;
    const hasPrevPage = filters.page > 1;

    // Log this access for audit purposes
    await routeLogger.info("Admin accessed logs API", {
      source: "admin-logs-api",
      userId: session.user.id,
      metadata: { filters }
    });

    return NextResponse.json({
      logs,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      }
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch logs", message: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/admin/logs - Create a new log entry (for testing)
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in" },
        { status: 401 }
      );
    }

    // Verify admin role
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only admins can create test logs" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { level, message, source, metadata } = body;

    if (!level || !message) {
      return NextResponse.json(
        { error: "Level and message are required" },
        { status: 400 }
      );
    }

    // Validate log level
    const validLevels: LogLevel[] = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];
    const normalizedLevel = level.toUpperCase() as LogLevel;
    
    if (!validLevels.includes(normalizedLevel)) {
      return NextResponse.json(
        { error: "Invalid log level. Must be one of: DEBUG, INFO, WARNING, ERROR, CRITICAL" },
        { status: 400 }
      );
    }

    // Create a test log entry directly with Prisma
    await prisma.appLog.create({
      data: {
        level: normalizedLevel,
        message,
        source: source || "admin-test",
        userId: session.user.id,
        metadata: metadata || { test: true }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Log entry created successfully"
    });
  } catch (error) {
    console.error("Error creating test log:", error);
    return NextResponse.json(
      { error: "Failed to create test log", message: (error as Error).message },
      { status: 500 }
    );
  }
} 