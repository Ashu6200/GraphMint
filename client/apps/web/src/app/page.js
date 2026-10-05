"use client";

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@repo/ui";
import { useCoreHealth, usePlatformHealth, useAiHealth } from "@repo/api";
import { Network, Database, Cpu, Layers, RefreshCw } from "lucide-react";

export default function Home() {
  const coreHealth = useCoreHealth();
  const platformHealth = usePlatformHealth();
  const aiHealth = useAiHealth();

  const handleRefresh = () => {
    coreHealth.refetch();
    platformHealth.refetch();
    aiHealth.refetch();
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-start p-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col items-center text-center space-y-3 pt-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold shadow-md">
          <Network className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          GraphMint Web Application
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Shared monorepo architecture: consuming shared UI design tokens & components from{" "}
          <Badge variant="outline" className="font-mono text-xs">@repo/ui</Badge> and standardized microservices API from{" "}
          <Badge variant="outline" className="font-mono text-xs">@repo/api</Badge>.
        </p>
      </div>

      {/* Cluster Health Cards */}
      <div className="grid gap-4 w-full md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Core Service</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {coreHealth.isLoading ? "Connecting..." : coreHealth.isSuccess ? "Online" : "Offline"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">/core/health</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Service</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {platformHealth.isLoading ? "Connecting..." : platformHealth.isSuccess ? "Online" : "Offline"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">/platform/health</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Service</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {aiHealth.isLoading ? "Connecting..." : aiHealth.isSuccess ? "Online" : "Offline"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">/ai/health</p>
          </CardContent>
        </Card>
      </div>

      {/* Shared Components and Table */}
      <Card className="w-full shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Shared Microservice Endpoint Registry</CardTitle>
            <CardDescription>
              Demonstrating shared shadcn UI table & components in Next.js
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${coreHealth.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Exported API</TableHead>
                <TableHead className="text-right">Shared Scope</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Core Service</TableCell>
                <TableCell><code className="text-xs">/core/graphs</code></TableCell>
                <TableCell><code className="text-xs text-primary">useGraphs()</code></TableCell>
                <TableCell className="text-right"><Badge>Next.js & Electron</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Platform Service</TableCell>
                <TableCell><code className="text-xs">/platform/auth/me</code></TableCell>
                <TableCell><code className="text-xs text-primary">useCurrentUser()</code></TableCell>
                <TableCell className="text-right"><Badge>Next.js & Electron</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">AI Service</TableCell>
                <TableCell><code className="text-xs">/ai/generate</code></TableCell>
                <TableCell><code className="text-xs text-primary">useAiGenerateGraph()</code></TableCell>
                <TableCell className="text-right"><Badge>Next.js & Electron</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
