"use client";

import type React from "react";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Home, LayoutDashboard, LogOut, Package, Settings, ShoppingCart, Users } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DashboardAuthGuard } from "@/components/DashboardAuthGuard";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <DashboardAuthGuard>
      {(user) => (
        <SidebarProvider>
          <div className="flex h-screen w-screen">
            <Sidebar>
              <SidebarHeader>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton size="lg">
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <LayoutDashboard className="size-4" />
                      </div>
                      <div className="flex flex-col gap-0.5 leading-none">
                        <span className="font-semibold">MarketPlace</span>
                        <span className="text-xs text-muted-foreground">{user.role}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                          <a href="/dashboard">
                            <Home />
                            <span>Dashboard</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      {/* Buyer specific menu items */}
                      {user.role === "buyer" && (
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild isActive={pathname === "/dashboard/orders"}>
                            <a href="/dashboard/orders">
                              <ShoppingCart />
                              <span>My Orders</span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}

                      {/* Seller specific menu items */}
                      {user.role === "seller" && (
                        <>
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/dashboard/products"}>
                              <a href="/dashboard/products">
                                <Package />
                                <span>Products</span>
                              </a>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/dashboard/sales"}>
                              <a href="/dashboard/sales">
                                <BarChart3 />
                                <span>Sales</span>
                              </a>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        </>
                      )}

                      {/* Mediator specific menu items */}
                      {user.role === "mediator" && (
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild isActive={pathname === "/dashboard/disputes"}>
                            <a href="/dashboard/disputes">
                              <Users />
                              <span>Disputes</span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}

                      {/* Admin specific menu items */}
                      {user.role === "admin" && (
                        <>
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/dashboard/users"}>
                              <a href="/dashboard/users">
                                <Users />
                                <span>Users</span>
                              </a>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/dashboard/products"}>
                              <a href="/dashboard/products">
                                <Package />
                                <span>Products</span>
                              </a>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/dashboard/analytics"}>
                              <a href="/dashboard/analytics">
                                <BarChart3 />
                                <span>Analytics</span>
                              </a>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        </>
                      )}

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === "/dashboard/settings"}>
                          <a href="/dashboard/settings">
                            <Settings />
                            <span>Settings</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
              <SidebarFooter>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout}>
                      <LogOut />
                      <span>Logout</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
            </Sidebar>

            <div className="flex-1 overflow-auto w-full">
              <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6 w-full">
                <SidebarTrigger />
                <div className="ml-auto flex items-center gap-4">
                  <ThemeToggle />
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
              </header>
              <main className="flex-1 p-6 w-full">{children}</main>
            </div>
          </div>
        </SidebarProvider>
      )}
    </DashboardAuthGuard>
  );
}
