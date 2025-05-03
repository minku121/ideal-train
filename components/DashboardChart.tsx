"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";

// This would typically be done with a library like Chart.js, Recharts, or D3
// For simplicity, we're creating a custom bar chart visualization

interface ChartProps {
  monthlyOrders: { dateOfOrder: string; _count: { id: number } }[];
  monthlyUsers: { createdAt: string; _count: { id: number } }[];
}

export function DashboardChart({ monthlyOrders, monthlyUsers }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // Process the data to group by month
  const processedData = () => {
    const monthData: Record<string, { orders: number; users: number }> = {};

    // Process orders
    monthlyOrders.forEach(item => {
      try {
        const date = new Date(item.dateOfOrder);
        const monthKey = format(date, 'MMM yyyy');
        
        if (!monthData[monthKey]) {
          monthData[monthKey] = { orders: 0, users: 0 };
        }
        
        monthData[monthKey].orders += item._count.id;
      } catch (error) {
        console.error("Error processing order date:", error);
      }
    });

    // Process users
    monthlyUsers.forEach(item => {
      try {
        const date = new Date(item.createdAt);
        const monthKey = format(date, 'MMM yyyy');
        
        if (!monthData[monthKey]) {
          monthData[monthKey] = { orders: 0, users: 0 };
        }
        
        monthData[monthKey].users += item._count.id;
      } catch (error) {
        console.error("Error processing user date:", error);
      }
    });

    // Sort by date
    return Object.entries(monthData)
      .sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateA.getTime() - dateB.getTime();
      })
      .map(([month, data]) => ({ month, ...data }));
  };

  const chartData = processedData();
  const maxValue = Math.max(
    ...chartData.map(d => Math.max(d.orders, d.users))
  );

  return (
    <Card className="col-span-7">
      <CardHeader>
        <CardTitle>Monthly Statistics</CardTitle>
        <CardDescription>Order and user growth over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] relative">
          {/* Y-axis labels */}
          <div className="absolute top-0 left-0 bottom-0 w-10 flex flex-col justify-between text-xs text-gray-500">
            <div>
              {maxValue}
            </div>
            <div>
              {Math.floor(maxValue * 0.75)}
            </div>
            <div>
              {Math.floor(maxValue * 0.5)}
            </div>
            <div>
              {Math.floor(maxValue * 0.25)}
            </div>
            <div>0</div>
          </div>

          {/* Chart grid */}
          <div className="absolute left-10 right-0 top-0 bottom-16 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            {[0.25, 0.5, 0.75].map((line) => (
              <div
                key={line}
                className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-700"
                style={{ top: `${100 - line * 100}%` }}
              />
            ))}

            {/* Chart bars */}
            <div className="absolute inset-0 flex items-end justify-around">
              {chartData.map((item, i) => (
                <div key={i} className="flex items-end space-x-1 h-full">
                  {/* Orders bar */}
                  <div
                    className="w-5 bg-blue-500 rounded-t"
                    style={{
                      height: `${(item.orders / maxValue) * 100}%`,
                    }}
                  />
                  {/* Users bar */}
                  <div
                    className="w-5 bg-green-500 rounded-t"
                    style={{
                      height: `${(item.users / maxValue) * 100}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="absolute left-10 right-0 bottom-0 h-16 flex justify-around items-center text-xs text-gray-500">
            {chartData.map((item, i) => (
              <div key={i} className="text-center">
                {item.month}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="absolute bottom-0 left-10 right-0 flex justify-center space-x-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 mr-1" />
              <span>Orders</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 mr-1" />
              <span>New Users</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 