import React, { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Progress,
  Switch,
  Slider,
  Separator,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@repo/ui';
import { useCoreHealth, usePlatformHealth, useAiHealth, coreApi } from '@repo/api';
import { useAppStore } from './store/useAppStore.js';
import {
  Activity,
  Layers,
  Database,
  Cpu,
  RefreshCw,
  Plus,
  Minus,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Network,
  Sliders,
  Share2,
  Terminal,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  const {
    count,
    increment,
    decrement,
    resetCount,
    activeTab,
    setActiveTab,
    zoomLevel,
    setZoomLevel,
    searchQuery,
    setSearchQuery,
    activityLogs,
    addActivityLog,
  } = useAppStore();

  const [darkMode, setDarkMode] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // TanStack Query Hooks from shared @repo/api
  const coreHealth = useCoreHealth();
  const platformHealth = usePlatformHealth();
  const aiHealth = useAiHealth();

  const handleRefreshApis = () => {
    coreHealth.refetch();
    platformHealth.refetch();
    aiHealth.refetch();
    addActivityLog('Refetched microservices cluster health', 'info');
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen w-screen flex-col bg-background text-foreground overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-14 items-center justify-between border-b px-6 bg-card/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-wide">GraphMint</span>
              <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground uppercase">
                Desktop
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search nodes or services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshApis}
              className="gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${coreHealth.isFetching ? 'animate-spin' : ''}`} />
              <span>Sync APIs</span>
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 shadow-sm">
                  <Plus className="h-4 w-4" />
                  <span>New Graph</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Knowledge Graph</DialogTitle>
                  <DialogDescription>
                    Configure initial properties for your new graph canvas.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label className="text-xs font-medium">Graph Name</label>
                    <Input placeholder="e.g. Distributed System Architecture" defaultValue="My System Graph" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-medium">Description</label>
                    <Input placeholder="Brief overview of the graph scope" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => {
                    setDialogOpen(false);
                    addActivityLog('Created new graph: My System Graph', 'success');
                  }}>
                    Create Graph
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Workspace with Tabs */}
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">GraphMint Monorepo Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Shared Architecture: <Badge variant="outline" className="mx-1 font-mono text-xs">@repo/ui</Badge> + <Badge variant="outline" className="mx-1 font-mono text-xs">@repo/api</Badge> (Web & Desktop)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={coreHealth.isSuccess ? 'default' : 'secondary'} className="gap-1.5 py-1 px-2.5">
                  <span className={`h-2 w-2 rounded-full ${coreHealth.isSuccess ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  Gateway Status: {coreHealth.isSuccess ? 'Connected' : 'Standby'}
                </Badge>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="overview">API Cluster</TabsTrigger>
                <TabsTrigger value="state">Zustand State</TabsTrigger>
                <TabsTrigger value="components">UI Showcase</TabsTrigger>
              </TabsList>

              {/* Tab 1: Standardized API Cluster */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Core Service Card */}
                  <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Core Service</CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {coreHealth.isLoading ? 'Checking...' : coreHealth.isSuccess ? 'Online' : 'Offline'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Endpoint: <code className="bg-muted px-1 py-0.5 rounded text-[11px]">/core/health</code>
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant={coreHealth.isSuccess ? 'default' : 'secondary'} className="text-[10px]">
                          {coreHealth.isSuccess ? 'Prisma & Redis OK' : 'Local Fallback'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Platform Service Card */}
                  <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Platform Service</CardTitle>
                      <Layers className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {platformHealth.isLoading ? 'Checking...' : platformHealth.isSuccess ? 'Online' : 'Offline'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Endpoint: <code className="bg-muted px-1 py-0.5 rounded text-[11px]">/platform/health</code>
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant={platformHealth.isSuccess ? 'default' : 'secondary'} className="text-[10px]">
                          Auth & Users API
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Service Card */}
                  <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">AI Service</CardTitle>
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {aiHealth.isLoading ? 'Checking...' : aiHealth.isSuccess ? 'Online' : 'Offline'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Endpoint: <code className="bg-muted px-1 py-0.5 rounded text-[11px]">/ai/health</code>
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant={aiHealth.isSuccess ? 'default' : 'secondary'} className="text-[10px]">
                          Graph Generation Engine
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Microservice Endpoint Registry Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Registered Microservice Endpoints</CardTitle>
                    <CardDescription>
                      All endpoints are centrally registered in <code className="bg-muted px-1 py-0.5 rounded">packages/api</code> and shared between Web and Desktop.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px]">Service</TableHead>
                          <TableHead>Endpoint Path</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Exported Hook / Function</TableHead>
                          <TableHead className="text-right">Platform</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Core Service</TableCell>
                          <TableCell><code className="text-xs">/core/health</code></TableCell>
                          <TableCell><Badge variant="outline">GET</Badge></TableCell>
                          <TableCell><code className="text-xs text-primary">useCoreHealth()</code></TableCell>
                          <TableCell className="text-right"><Badge>Web & Desktop</Badge></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Core Service</TableCell>
                          <TableCell><code className="text-xs">/core/graphs</code></TableCell>
                          <TableCell><Badge variant="outline">GET / POST</Badge></TableCell>
                          <TableCell><code className="text-xs text-primary">useGraphs(), useCreateGraph()</code></TableCell>
                          <TableCell className="text-right"><Badge>Web & Desktop</Badge></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Platform Service</TableCell>
                          <TableCell><code className="text-xs">/platform/auth/login</code></TableCell>
                          <TableCell><Badge variant="outline">POST</Badge></TableCell>
                          <TableCell><code className="text-xs text-primary">useLogin()</code></TableCell>
                          <TableCell className="text-right"><Badge>Web & Desktop</Badge></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">AI Service</TableCell>
                          <TableCell><code className="text-xs">/ai/generate</code></TableCell>
                          <TableCell><Badge variant="outline">POST</Badge></TableCell>
                          <TableCell><code className="text-xs text-primary">useAiGenerateGraph()</code></TableCell>
                          <TableCell className="text-right"><Badge>Web & Desktop</Badge></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: Zustand State Management */}
              <TabsContent value="state" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Zustand Global Counter</CardTitle>
                      <CardDescription>
                        Reactive global state managed with Zustand.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-center p-6 bg-muted/40 rounded-lg">
                        <span className="text-5xl font-mono font-bold">{count}</span>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <Button variant="outline" size="icon" onClick={decrement}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={increment}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="secondary" onClick={resetCount} className="gap-2">
                          <RotateCcw className="h-4 w-4" />
                          <span>Reset</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Canvas Zoom & Settings</CardTitle>
                      <CardDescription>
                        Real-time state synchronization for graph workspace.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">Canvas Zoom Level</span>
                          <span className="text-muted-foreground">{zoomLevel}%</span>
                        </div>
                        <Slider
                          value={[zoomLevel]}
                          min={25}
                          max={200}
                          step={5}
                          onValueChange={(val) => setZoomLevel(val[0])}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Dark Mode</div>
                          <div className="text-xs text-muted-foreground">Adjust interface contrast</div>
                        </div>
                        <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab 3: UI Showcase with @repo/ui components */}
              <TabsContent value="components" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Shared shadcn UI Component Suite</CardTitle>
                    <CardDescription>
                      Exported from <code className="bg-muted px-1 py-0.5 rounded">packages/ui</code> and usable in both Next.js & Electron.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-wrap gap-3 items-center">
                      <Button>Default</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="destructive">Destructive</Button>
                    </div>

                    <Separator />

                    <div className="flex flex-wrap gap-2">
                      <Badge>Default Badge</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="outline">Outline</Badge>
                      <Badge variant="destructive">Destructive</Badge>
                    </div>

                    <Separator />

                    <div className="space-y-2 max-w-md">
                      <div className="text-xs font-medium">Progress Bar Example</div>
                      <Progress value={65} />
                    </div>

                    <Separator />

                    <Accordion type="single" collapsible className="w-full max-w-lg">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>How does @repo/api share endpoints?</AccordionTrigger>
                        <AccordionContent>
                          Endpoints and TanStack Query hooks are encapsulated in <code>packages/api</code> and consumed by Next.js and Electron through standard pnpm workspace linking.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger>How is Electron configured?</AccordionTrigger>
                        <AccordionContent>
                          Electron runs purely in JavaScript (<code>main.js</code> and <code>preload.js</code>), bundled with Vite and Tailwind CSS.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>

          {/* Activity Log Sidebar */}
          <aside className="w-80 border-l bg-card/40 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Activity & Events</h3>
              </div>
              <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
                {activityLogs.map((log) => (
                  <div key={log.id} className="text-xs p-2.5 rounded-lg border bg-background/80 shadow-xs">
                    <div className="font-medium text-foreground">{log.action}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 flex justify-between">
                      <span>{log.type.toUpperCase()}</span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-3 text-[11px] text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Architecture</span>
                <span className="font-mono text-foreground">Monorepo</span>
              </div>
              <div className="flex justify-between">
                <span>UI Library</span>
                <span className="font-mono text-foreground">@repo/ui (shadcn)</span>
              </div>
              <div className="flex justify-between">
                <span>API Layer</span>
                <span className="font-mono text-foreground">@repo/api</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </TooltipProvider>
  );
}
