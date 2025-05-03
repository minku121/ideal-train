"use client";

import type React from "react";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Home, LayoutDashboard, LogOut, Package, Settings, ShoppingCart, Users, AlarmClock } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { DashboardAuthGuard } from "@/components/DashboardAuthGuard";

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
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Loader } from "@/components/ui/loader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <DashboardAuthGuard>
      <SidebarProvider>
        <div className="flex h-screen w-screen">
          {status === "loading" ? (
            <div className="flex h-screen w-full items-center justify-center">
              <Loader size="lg" text="Loading dashboard..." />
            </div>
          ) : session?.user ? (
            <>
              <Sidebar collapsible="icon">
                <SidebarHeader>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton size="lg">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                          <LayoutDashboard className="size-4" />
                        </div>
                        <div className="flex flex-col gap-0.5 leading-none">
                          <span className="font-semibold">MarketPlace</span>
                          <span className="text-xs text-muted-foreground">{session.user.role}</span>
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
                        {session.user.role === "BUYER" && (
                          <>
                            <SidebarMenuItem>
                              <SidebarMenuButton asChild isActive={pathname === "/dashboard/orders"}>
                                <a href="/dashboard/orders">
                                  <ShoppingCart />
                                  <span>My Orders</span>
                                </a>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <SidebarMenuButton asChild isActive={pathname === "/dashboard/add-order"}>
                                <a href="/dashboard/add-order">
                                  <Package />
                                  <span>Add Order</span>
                                </a>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <SidebarMenuButton asChild isActive={pathname === "/dashboard/pending-orders"}>
                                <a href="/dashboard/pending-orders">
                                  <BarChart3 />
                                  <span>Pending Orders</span>
                                </a>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          </>
                        )}

                        {/* Seller specific menu items */}
                        {session.user.role === "SELLER" && (
                          <>
                            <SidebarMenuItem>
                              <SidebarMenuButton asChild isActive={pathname === "/dashboard/products"}>
                                <a href="/dashboard/products">
                                  <Package />
                                  <span>My Products</span>
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
                        {session.user.role === "MEDIATOR" && (
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
                        {session.user.role === "ADMIN" && (
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
                              <SidebarMenuButton asChild isActive={pathname.includes("/dashboard/admin/products")}>
                                <a href="/dashboard/admin/products">
                                  <Package />
                                  <span>Products</span>
                                </a>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <SidebarMenuButton asChild isActive={pathname.includes("/dashboard/admin/orders")}>
                                <a href="/dashboard/admin/orders">
                                  <ShoppingCart />
                                  <span>Orders</span>
                                </a>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <SidebarMenuButton asChild isActive={pathname.includes("/dashboard/admin/mediators")}>
                                <a href="/dashboard/admin/mediators">
                                  <Users />
                                  <span>Mediators</span>
                                </a>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <SidebarMenuButton asChild isActive={pathname.includes("/dashboard/admin/logs")}>
                                <a href="/dashboard/admin/logs">
                                  <AlarmClock />
                                  <span>Logs</span>
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
                <SidebarFooter className="p-5 group-data-[collapsible=icon]:p-2">
                  <div className="grid gap-4 max-w-full">
                    <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
                      <div className="flex flex-col gap-1 group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-medium">{session.user.name || session.user.email}</span>
                        <span className="text-xs text-muted-foreground">{session.user.email}</span>
                      </div>
                      <div className="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                        <ThemeToggle />
                      </div>
                    </div>
                    <button
                      className="flex w-full items-center gap-3 rounded-lg bg-muted/50 px-5 py-3 text-sm font-medium hover:bg-muted group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2"
                      onClick={handleLogout}
                    >
                      <LogOut className="size-5" />
                      <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                    </button>
                  </div>
                </SidebarFooter>
              </Sidebar>
              <main className="h-full w-full overflow-auto pl-0 md:pl-6">
                <div className="container px-4 md:px-8 py-4 md:py-6">
                  <div className="flex items-center justify-between mb-4">
                    <SidebarTrigger className="md:mr-4" />
                  </div>
                  {children}
                </div>
              </main>
            </>
          ) : null}
        </div>
      </SidebarProvider>
    </DashboardAuthGuard>
  );
}
