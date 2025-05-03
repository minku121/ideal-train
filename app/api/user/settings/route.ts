import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { Role, Prisma } from "@prisma/client";

// GET /api/user/settings - Get current user settings
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // We will manually construct the query since there might be issues with the Prisma client
    // Query using raw SQL but in a safer way
    const settingsQuery = `
      SELECT * FROM UserSettings WHERE userId = ?
    `;
    
    const results = await prisma.$queryRawUnsafe(settingsQuery, userId);
    let userSettings = Array.isArray(results) && results.length > 0 ? results[0] : null;

    // If settings don't exist yet, create default settings
    if (!userSettings) {
      // Insert default settings
      const insertQuery = `
        INSERT INTO UserSettings (userId, darkMode, emailNotifications, language, showOrderHistory, 
        showProfile, showEmail, primaryColor)
        VALUES (?, false, true, 'en', true, true, false, '#7C3AED')
      `;
      
      await prisma.$executeRawUnsafe(insertQuery, userId);
      
      // Fetch the newly created settings
      const newResults = await prisma.$queryRawUnsafe(settingsQuery, userId);
      userSettings = Array.isArray(newResults) && newResults.length > 0 ? newResults[0] : null;
    }

    return NextResponse.json(userSettings);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/user/settings - Update user settings
export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await req.json();
    
    // Ensure role is available and valid
    const userRole = session.user.role as Role || Role.BUYER;

    // Check if settings exist for this user
    const checkQuery = `SELECT COUNT(*) as count FROM UserSettings WHERE userId = ?`;
    const checkResult = await prisma.$queryRawUnsafe(checkQuery, userId);
    const exists = Array.isArray(checkResult) && checkResult[0] && (checkResult[0] as any).count > 0;

    // Validate settings based on user role
    const validatedSettings = validateSettingsByRole(body, userRole);
    let userSettings;

    if (exists) {
      // Update existing settings
      // Build the update query
      const updatePairs = [];
      const updateValues = [];
      
      for (const [key, value] of Object.entries(validatedSettings)) {
        if (value !== undefined) {
          updatePairs.push(`${key} = ?`);
          updateValues.push(value);
        }
      }
      
      if (updatePairs.length > 0) {
        updatePairs.push(`updatedAt = NOW()`);
        
        const updateQuery = `
          UPDATE UserSettings 
          SET ${updatePairs.join(', ')}
          WHERE userId = ?
        `;
        
        await prisma.$executeRawUnsafe(updateQuery, ...updateValues, userId);
      }
    } else {
      // Insert new settings
      const fields = ['userId'];
      const values = [userId];
      
      // Add all defined values with proper typing
      Object.entries(validatedSettings).forEach(([key, value]) => {
        if (value !== undefined) {
          fields.push(key);
          values.push(value);
        }
      });
      
      const placeholders = fields.map(() => '?').join(', ');
      
      const insertQuery = `
        INSERT INTO UserSettings (${fields.join(', ')})
        VALUES (${placeholders})
      `;
      
      await prisma.$executeRawUnsafe(insertQuery, ...values);
    }
    
    // Fetch the updated settings
    const settingsQuery = `SELECT * FROM UserSettings WHERE userId = ?`;
    const results = await prisma.$queryRawUnsafe(settingsQuery, userId);
    userSettings = Array.isArray(results) && results.length > 0 ? results[0] : null;

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: userSettings,
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

// Helper function to validate settings based on user role
function validateSettingsByRole(settings: any, role: Role) {
  // Common settings all users can update
  const commonSettings = {
    darkMode: settings.darkMode !== undefined ? settings.darkMode : undefined,
    emailNotifications: settings.emailNotifications !== undefined ? settings.emailNotifications : undefined,
    language: settings.language || undefined,
    showProfile: settings.showProfile !== undefined ? settings.showProfile : undefined,
    showEmail: settings.showEmail !== undefined ? settings.showEmail : undefined,
    primaryColor: settings.primaryColor || undefined,
  };

  // Role-specific settings
  const roleSpecificSettings: Record<string, any> = {};

  // UPI ID is available to all users
  if (settings.upiId !== undefined) {
    roleSpecificSettings.upiId = settings.upiId;
  }

  switch (role) {
    case Role.BUYER:
      if (settings.showOrderHistory !== undefined) {
        roleSpecificSettings.showOrderHistory = settings.showOrderHistory;
      }
      if (settings.defaultPaymentMethod !== undefined) {
        roleSpecificSettings.defaultPaymentMethod = settings.defaultPaymentMethod;
      }
      if (settings.orderStatusNotifications !== undefined) {
        roleSpecificSettings.orderStatusNotifications = settings.orderStatusNotifications;
      }
      break;

    case Role.SELLER:
      if (settings.autoAcceptOrders !== undefined) {
        roleSpecificSettings.autoAcceptOrders = settings.autoAcceptOrders;
      }
      if (settings.commissionAlerts !== undefined) {
        roleSpecificSettings.commissionAlerts = settings.commissionAlerts;
      }
      break;

    case Role.MEDIATOR:
      if (settings.disputeNotifications !== undefined) {
        roleSpecificSettings.disputeNotifications = settings.disputeNotifications;
      }
      if (settings.autoAssignDisputes !== undefined) {
        roleSpecificSettings.autoAssignDisputes = settings.autoAssignDisputes;
      }
      if (settings.disputeResponseTime !== undefined) {
        roleSpecificSettings.disputeResponseTime = settings.disputeResponseTime;
      }
      if (settings.mediatorBio !== undefined) {
        roleSpecificSettings.mediatorBio = settings.mediatorBio;
      }
      break;

    case Role.ADMIN:
      if (settings.adminDashboardView !== undefined) {
        roleSpecificSettings.adminDashboardView = settings.adminDashboardView;
      }
      if (settings.enableAdvancedFeatures !== undefined) {
        roleSpecificSettings.enableAdvancedFeatures = settings.enableAdvancedFeatures;
      }
      if (settings.logsRetentionDays !== undefined) {
        roleSpecificSettings.logsRetentionDays = settings.logsRetentionDays;
      }
      if (settings.systemAlerts !== undefined) {
        roleSpecificSettings.systemAlerts = settings.systemAlerts;
      }
      break;
  }

  // For all roles, system alerts can be set
  if (settings.systemAlerts !== undefined && (role === Role.ADMIN || role === Role.MEDIATOR)) {
    roleSpecificSettings.systemAlerts = settings.systemAlerts;
  }

  // Any custom settings can go into additionalSettings as JSON
  if (settings.additionalSettings) {
    roleSpecificSettings.additionalSettings = settings.additionalSettings;
  }

  return { ...commonSettings, ...roleSpecificSettings };
} 