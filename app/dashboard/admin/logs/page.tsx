"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { 
  AlertTriangle, Bug, Info, 
  MessageSquare, Filter, RefreshCw,
  Trash, AlarmClock, Database, Download
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "@/components/ui/loader";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Define log entry type
interface LogEntry {
  id: number;
  level: string;
  message: string;
  source?: string;
  userId?: number;
  metadata?: any;
  createdAt: string;
}

// Define filter types
interface LogFilters {
  level?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

// Define pagination type
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function AdminLogsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  
  // Filter state
  const [filters, setFilters] = useState<LogFilters>({
    level: undefined,
    source: undefined,
    startDate: undefined,
    endDate: undefined,
    page: 1,
    limit: 50,
  });
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(10); // seconds
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Test log creation state
  const [testLog, setTestLog] = useState({
    level: "INFO",
    message: "Test log message",
    source: "admin-log-viewer",
    metadata: JSON.stringify({ test: true, timestamp: new Date().toISOString() }, null, 2),
  });
  
  // Check authentication and admin role
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user) {
      router.replace("/login");
      return;
    }
    
    if (session.user.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }
    
    // Initial logs fetch
    fetchLogs();
  }, [router, session, status]);
  
  // Handle auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshTimer.current = setInterval(() => {
        fetchLogs();
      }, refreshInterval * 1000);
    } else if (refreshTimer.current) {
      clearInterval(refreshTimer.current);
      refreshTimer.current = null;
    }
    
    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [autoRefresh, refreshInterval, filters]);
  
  // Fetch logs with current filters
  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      
      if (filters.level) {
        queryParams.append("level", filters.level);
      }
      
      if (filters.source) {
        queryParams.append("source", filters.source);
      }
      
      if (filters.startDate) {
        queryParams.append("startDate", filters.startDate);
      }
      
      if (filters.endDate) {
        queryParams.append("endDate", filters.endDate);
      }
      
      queryParams.append("page", filters.page.toString());
      queryParams.append("limit", filters.limit.toString());
      
      const response = await fetch(`/api/admin/logs?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch logs");
      }
      
      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch logs");
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Apply filters and reset to page 1
  const applyFilters = () => {
    setFilters(prevFilters => ({ ...prevFilters, page: 1 }));
    fetchLogs();
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      level: undefined,
      source: undefined,
      startDate: undefined,
      endDate: undefined,
      page: 1,
      limit: 50,
    });
    setTimeout(fetchLogs, 0);
  };
  
  // Navigate to a specific page
  const goToPage = (page: number) => {
    setFilters(prevFilters => ({ ...prevFilters, page }));
    setTimeout(fetchLogs, 0);
  };
  
  // Create a test log entry
  const createTestLog = async () => {
    try {
      setLoading(true);
      
      let metadata;
      try {
        metadata = JSON.parse(testLog.metadata);
      } catch (err) {
        metadata = { parseError: true, raw: testLog.metadata };
      }
      
      const response = await fetch("/api/admin/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level: testLog.level,
          message: testLog.message,
          source: testLog.source,
          metadata,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create test log");
      }
      
      toast.success("Test log created successfully");
      
      // Refetch logs to show the new entry
      fetchLogs();
    } catch (err: any) {
      setError(err.message || "Failed to create test log");
      toast.error(err.message || "Failed to create test log");
    } finally {
      setLoading(false);
    }
  };
  
  // Get the appropriate icon for a log level
  const getLevelIcon = (level: string) => {
    switch (level) {
      case "DEBUG":
        return <Bug className="h-4 w-4" />;
      case "INFO":
        return <Info className="h-4 w-4" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4" />;
      case "ERROR":
      case "CRITICAL":
        return <Trash className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };
  
  // Get the color for a log level badge
  const getLevelColor = (level: string) => {
    switch (level) {
      case "DEBUG":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "INFO":
        return "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-300";
      case "WARNING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-300";
      case "ERROR":
        return "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-300";
      case "CRITICAL":
        return "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };
  
  // Format date string
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPpp");
    } catch (err) {
      return dateString;
    }
  };
  
  // Export logs to JSON file
  const exportLogs = () => {
    const exportData = {
      logs,
      exportedAt: new Date().toISOString(),
      filters,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          <p className="text-muted-foreground mt-1">
            View and manage application system logs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportLogs}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-md">Filter Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-2">
              <label htmlFor="level">Log Level</label>
              <Select 
                value={filters.level || "ALL"}
                onValueChange={(value) => setFilters(prev => ({ ...prev, level: value === "ALL" ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Levels</SelectItem>
                  <SelectItem value="DEBUG">Debug</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="source">Source</label>
              <Input
                id="source"
                placeholder="Filter by source"
                value={filters.source || ""}
                onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value || undefined }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="startDate">Start Date</label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={filters.startDate || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value || undefined }))}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="endDate">End Date</label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={filters.endDate || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value || undefined }))}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 pb-2">
            <Button variant="outline" onClick={resetFilters} className="mr-2">
              Reset
            </Button>
            <Button onClick={applyFilters}>
              Apply Filters
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-md">Auto-Refresh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span>Enable Auto-Refresh</span>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant={autoRefresh ? "default" : "outline"}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  {autoRefresh ? "On" : "Off"}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="refreshInterval">Refresh Interval (seconds)</label>
              <Select 
                value={refreshInterval.toString()}
                onValueChange={(value) => setRefreshInterval(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 pb-2 text-xs text-muted-foreground">
            {autoRefresh ? (
              <div className="flex items-center">
                <AlarmClock className="h-4 w-4 mr-2" />
                <span>Auto-refreshing every {refreshInterval} seconds</span>
              </div>
            ) : (
              <span>Auto-refresh is disabled</span>
            )}
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-md">Create Test Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-2">
              <label htmlFor="testLogLevel">Log Level</label>
              <Select 
                value={testLog.level}
                onValueChange={(value) => setTestLog(prev => ({ ...prev, level: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBUG">Debug</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="testLogMessage">Message</label>
              <Input
                id="testLogMessage"
                placeholder="Log message"
                value={testLog.message}
                onChange={(e) => setTestLog(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="testLogSource">Source</label>
              <Input
                id="testLogSource"
                placeholder="Log source"
                value={testLog.source}
                onChange={(e) => setTestLog(prev => ({ ...prev, source: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="testLogMetadata">Metadata (JSON)</label>
              <Textarea
                id="testLogMetadata"
                placeholder="{}"
                value={testLog.metadata}
                onChange={(e) => setTestLog(prev => ({ ...prev, metadata: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 pb-2">
            <Button onClick={createTestLog} disabled={loading}>
              Create Test Log
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-md dark:bg-red-900 dark:text-red-200 dark:border-red-700">
          <p className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span>{error}</span>
          </p>
        </div>
      )}
      
      <div className="bg-card rounded-md shadow border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Log Entries</h2>
          <div className="text-sm text-muted-foreground">
            Showing {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
          </div>
        </div>
        
        {loading && logs.length === 0 ? (
          <div className="p-8 flex items-center justify-center">
            <Loader size="md" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No log entries found</p>
            <p className="text-sm mt-2">Try adjusting your filters or create a test log entry</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-left text-xs font-medium text-muted-foreground">
                <tr className="border-b">
                  <th className="p-3 whitespace-nowrap">Timestamp</th>
                  <th className="p-3 whitespace-nowrap">Level</th>
                  <th className="p-3 whitespace-nowrap">Source</th>
                  <th className="p-3 whitespace-nowrap">Message</th>
                  <th className="p-3 whitespace-nowrap">User ID</th>
                  <th className="p-3 whitespace-nowrap">Metadata</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50">
                    <td className="p-3 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <Badge className={getLevelColor(log.level)}>
                        <span className="flex items-center gap-1">
                          {getLevelIcon(log.level)}
                          {log.level}
                        </span>
                      </Badge>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {log.source || "unknown"}
                    </td>
                    <td className="p-3">
                      {log.message}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {log.userId || "—"}
                    </td>
                    <td className="p-3">
                      <pre className="text-xs whitespace-pre-wrap bg-muted p-2 rounded">
                        {log.metadata ? JSON.stringify(log.metadata, null, 2) : "—"}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 