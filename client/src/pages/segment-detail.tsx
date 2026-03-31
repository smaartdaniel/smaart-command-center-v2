import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Database, Smartphone, MapPin, Layout, Tv, Search,
  BookOpen, Handshake, Mail, Activity, BarChart3, Paintbrush, Crosshair,
  Twitter, ChevronDown, ExternalLink, Link2, Plug, PlusCircle,
  Code, FileText, Upload, Shield, Users, UserPlus, RefreshCw, Map,
  Settings, Image, Monitor, Target, LayoutGrid, TrendingUp,
  Film, Play, Volume2, FolderOpen, DollarSign, Key, Globe, Newspaper,
  Gift, Building, Megaphone, MessageSquare, Phone, GitBranch, Link,
  Gauge, Workflow, Bell, ClipboardCheck, Grid3x3, LayoutTemplate,
  Calendar, Quote, MessageCircle, Rocket, Share2, FileUp, Bot,
  Sparkles, Droplets, RotateCcw, ListChecks, FlaskConical,
  ArrowLeft, CheckSquare, Square, X, Info,
} from "lucide-react";
import type { Segment, Module, BestPractice, Task, SegmentTool } from "@shared/schema";
import { useState, useRef, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link as WouterLink } from "wouter";
import { Slider } from "@/components/ui/slider";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const ICON_MAP: Record<string, any> = {
  Database, Smartphone, MapPin, Layout, Tv, Search, BookOpen, Handshake,
  Mail, Activity, BarChart3, Paintbrush, Crosshair, Twitter,
  Code, FileText, Upload, Shield, Users, UserPlus, RefreshCw, Map,
  Settings, Image, Monitor, Target, LayoutGrid, TrendingUp,
  Film, Play, Volume2, FolderOpen, DollarSign, Key, Globe, Newspaper,
  Gift, Building, Megaphone, MessageSquare, Phone, GitBranch, Link,
  Gauge, Workflow, Bell, ClipboardCheck, Grid3x3, LayoutTemplate,
  Calendar, Quote, MessageCircle, Rocket, Share2, FileUp, Bot,
  Sparkles, Droplets, RotateCcw, ListChecks, FlaskConical,
  Facebook: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  active: "Active",
  optimizing: "Optimizing",
};

const CATEGORY_COLORS: Record<string, string> = {
  framework: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  template: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  checklist: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  metric: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

type ModuleWithTasks = Module & { tasks: Task[]; guide?: string | null; defaultTasks?: string | null };

interface BudgetRule {
  rule: string;
  detail: string;
  source: string;
}

interface BudgetConfig {
  minMonthly: number;
  recommendedMonthly: number;
  maxMonthly: number;
  avgCPL: number;
  avgCPC: number;
  avgCPM: number;
  conversionRate: number;
  platformFee: number;
  rules?: BudgetRule[];
}

type SegmentDetail = Segment & {
  modules: ModuleWithTasks[];
  bestPractices: BestPractice[];
  tools: SegmentTool[];
  budgetConfig: BudgetConfig | null;
};

function renderGuide(guide: string): React.ReactNode {
  const lines = guide.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      if (listType === 'ul') {
        elements.push(<ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">{listItems}</ul>);
      } else {
        elements.push(<ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">{listItems}</ol>);
      }
      listItems = [];
      listType = null;
    }
  };

  const formatInline = (text: string): React.ReactNode => {
    // Handle **bold** text
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h-${i}`} className="text-sm font-display font-bold text-foreground mt-4 mb-1.5 first:mt-0">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith('- ')) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(<li key={`li-${i}`} className="text-sm text-muted-foreground">{formatInline(line.slice(2))}</li>);
    } else if (/^\d+\.\s/.test(line)) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      const content = line.replace(/^\d+\.\s/, '');
      listItems.push(<li key={`li-${i}`} className="text-sm text-muted-foreground">{formatInline(content)}</li>);
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={`p-${i}`} className="text-sm text-muted-foreground leading-relaxed">
          {formatInline(line)}
        </p>
      );
    }
  }
  flushList();

  return <div className="space-y-2">{elements}</div>;
}

function ModuleCard({ mod, segmentId }: { mod: ModuleWithTasks; segmentId: number }) {
  const [open, setOpen] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const IconComponent = ICON_MAP[mod.icon];

  useEffect(() => {
    if (addingTask && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addingTask]);

  const addTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/tasks", {
        moduleId: mod.id,
        segmentId,
        title,
        status: "pending",
        priority: "medium",
        order: (mod.tasks?.length || 0) + 1,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/segments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setNewTaskTitle("");
      setAddingTask(false);
      toast({ title: "Task created" });
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      const res = await apiRequest("PATCH", `/api/tasks/${task.id}`, { status: newStatus });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/segments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await apiRequest("DELETE", `/api/tasks/${taskId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/segments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Task deleted" });
    },
  });

  const handleAddTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    addTaskMutation.mutate(title);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border border-card-border" data-testid={`card-module-${mod.slug}`}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {IconComponent && <IconComponent className="w-4 h-4 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-display font-bold truncate">{mod.name}</h3>
                  <Badge variant="secondary" className="text-[10px] h-5 shrink-0">{STATUS_LABELS[mod.status]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{mod.description}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Progress value={mod.progress} className="w-16 h-1.5" />
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 border-t border-border">
            {/* Guide Content */}
            {mod.guide && (
              <div className="pt-3 pb-3 border-b border-border/50 mb-3">
                {renderGuide(mod.guide)}
              </div>
            )}
            {/* Task Progress Bar */}
            {mod.tasks && mod.tasks.length > 0 && (
              <div className="flex items-center gap-3 pt-2 pb-2">
                <Progress value={mod.tasks.length > 0 ? Math.round((mod.tasks.filter(t => t.status === "completed").length / mod.tasks.length) * 100) : 0} className="flex-1 h-2" />
                <span className="text-xs font-mono text-muted-foreground shrink-0">
                  {mod.tasks.filter(t => t.status === "completed").length}/{mod.tasks.length} tasks
                </span>
              </div>
            )}
            <div className="pt-1 space-y-2">
              {mod.tasks && mod.tasks.length > 0 ? mod.tasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 group" data-testid={`task-${task.id}`}>
                  <button
                    onClick={() => toggleTaskMutation.mutate(task)}
                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    data-testid={`button-toggle-task-${task.id}`}
                  >
                    {task.status === "completed" ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  <span className={`text-sm flex-1 ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{task.title}</span>
                  <button
                    onClick={() => deleteTaskMutation.mutate(task.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    data-testid={`button-delete-task-${task.id}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground italic">No tasks yet</p>
              )}
              {addingTask ? (
                <div className="flex items-center gap-2" data-testid={`input-new-task-${mod.slug}`}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTask();
                      if (e.key === "Escape") { setAddingTask(false); setNewTaskTitle(""); }
                    }}
                    placeholder="Task name..."
                    className="flex-1 text-sm bg-transparent border-b border-primary/40 outline-none py-1 placeholder:text-muted-foreground/50"
                    data-testid={`input-task-title-${mod.slug}`}
                  />
                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={handleAddTask} disabled={!newTaskTitle.trim()} data-testid={`button-save-task-${mod.slug}`}>
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-muted-foreground" onClick={() => { setAddingTask(false); setNewTaskTitle(""); }} data-testid={`button-cancel-task-${mod.slug}`}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => { setAddingTask(true); setOpen(true); }} data-testid={`button-add-task-${mod.slug}`}>
                  <PlusCircle className="w-3.5 h-3.5" /> Add task
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function BestPracticeCard({ bp }: { bp: BestPractice & { howTo?: string | null } }) {
  const [showHowTo, setShowHowTo] = useState(false);

  return (
    <Card className="border border-card-border" data-testid={`card-bp-${bp.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm font-display font-bold">{bp.title}</h3>
          <Badge variant="outline" className={`text-[10px] shrink-0 border ${CATEGORY_COLORS[bp.category]}`}>
            {bp.category}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{bp.content}</p>
        {bp.sourceUrl && (
          <a href={bp.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 mt-3 text-xs text-primary hover:underline" data-testid={`link-bp-source-${bp.id}`}>
            <ExternalLink className="w-3 h-3" /> {bp.source}
          </a>
        )}
        {bp.howTo && (
          <div className="mt-3">
            <button
              onClick={() => setShowHowTo(!showHowTo)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              data-testid={`button-howto-${bp.id}`}
            >
              <Rocket className="w-3.5 h-3.5" />
              {showHowTo ? "Hide Guide" : "How To Do It"}
              <ChevronDown className={`w-3 h-3 transition-transform ${showHowTo ? "rotate-180" : ""}`} />
            </button>
            {showHowTo && (
              <div className="mt-3 pt-3 border-t border-border/50">
                {renderGuide(bp.howTo)}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const PLATFORM_RESOURCES: Record<string, { label: string; url: string; desc: string }[]> = {
  strategy: [
    { label: "Google Ads Help Center", url: "https://support.google.com/google-ads", desc: "Official Google Ads documentation and best practices" },
    { label: "Meta Business Help Center", url: "https://www.facebook.com/business/help", desc: "Meta advertising guides and troubleshooting" },
    { label: "HubSpot Marketing Blog", url: "https://blog.hubspot.com/marketing", desc: "Marketing strategy frameworks and templates" },
  ],
  operations: [
    { label: "Google Analytics Academy", url: "https://analytics.google.com/analytics/academy", desc: "Free courses on analytics and measurement" },
    { label: "Mailchimp Resources", url: "https://mailchimp.com/resources", desc: "Email marketing guides and benchmarks" },
    { label: "Canva Design School", url: "https://www.canva.com/designschool", desc: "Design fundamentals for marketing teams" },
  ],
  intelligence: [
    { label: "Google Trends", url: "https://trends.google.com", desc: "Explore search trends and market signals" },
    { label: "Semrush Academy", url: "https://www.semrush.com/academy", desc: "SEO, content marketing, and competitive analysis" },
    { label: "Think with Google", url: "https://www.thinkwithgoogle.com", desc: "Consumer insights and marketing research" },
  ],
};

function AdPlatformTab({ segmentName, modules, category }: { segmentName: string; modules: ModuleWithTasks[]; category: string }) {
  const resources = PLATFORM_RESOURCES[category] || PLATFORM_RESOURCES.strategy;

  return (
    <div className="space-y-5" data-testid="tab-ad-platform">
      {/* Platform Setup Guide */}
      <div>
        <h3 className="text-sm font-display font-bold mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" /> Platform Setup Guide for {segmentName}
        </h3>
        <div className="space-y-2">
          {modules.map((mod, i) => {
            const IconComponent = ICON_MAP[mod.icon];
            const isComplete = mod.progress === 100;
            return (
              <Card key={mod.id} className={`border ${isComplete ? "border-emerald-500/30 bg-emerald-500/5" : "border-card-border"}`} data-testid={`setup-step-${mod.slug}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isComplete ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary"}`}>
                      {isComplete ? <CheckSquare className="w-4 h-4" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-display font-bold">{mod.name}</h4>
                        <Badge variant="secondary" className="text-[10px] h-5">{mod.progress}%</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
                    </div>
                    <Progress value={mod.progress} className="w-20 h-1.5 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Resources */}
      <div>
        <h3 className="text-sm font-display font-bold mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" /> Resources
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {resources.map(r => (
            <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer">
              <Card className="border border-card-border hover:border-primary/30 transition-colors h-full cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
                    <h4 className="text-sm font-display font-bold text-primary">{r.label}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

const TOOL_TYPE_COLORS: Record<string, string> = {
  platform: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  api: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  tool: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  analytics: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

const TOOL_TYPE_LABELS: Record<string, string> = {
  platform: "Platforms",
  api: "APIs",
  tool: "Tools",
  analytics: "Analytics",
};

function ToolsTab({ tools }: { tools: SegmentTool[] }) {
  const grouped = useMemo(() => {
    const groups: Record<string, SegmentTool[]> = {};
    for (const tool of tools) {
      if (!groups[tool.type]) groups[tool.type] = [];
      groups[tool.type].push(tool);
    }
    return groups;
  }, [tools]);

  const typeOrder = ["platform", "api", "tool", "analytics"];

  if (tools.length === 0) {
    return (
      <Card className="border border-card-border">
        <CardContent className="p-6 text-center">
          <Plug className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">No tools documented yet for this segment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="tab-tools">
      {typeOrder.filter(t => grouped[t]).map(type => (
        <div key={type}>
          <h3 className="text-sm font-display font-bold mb-3 flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] border ${TOOL_TYPE_COLORS[type]}`}>
              {TOOL_TYPE_LABELS[type]}
            </Badge>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {grouped[type].map(tool => {
              const campaigns: string[] = (() => {
                try { return JSON.parse(tool.campaigns); } catch { return []; }
              })();
              return (
                <a key={tool.id} href={tool.url} target="_blank" rel="noopener noreferrer" className="block">
                  <Card className="border border-card-border hover:border-primary/30 transition-colors h-full cursor-pointer" data-testid={`tool-card-${tool.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
                          <h4 className="text-sm font-display font-bold text-primary truncate">{tool.name}</h4>
                        </div>
                        <Badge variant="secondary" className="text-[10px] h-5 shrink-0">{tool.pricing}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{tool.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {campaigns.map((c, i) => (
                          <Badge key={i} variant="outline" className="text-[9px] h-4 border-border/50">{c}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function BudgetCalculatorTab({ config, segmentName }: { config: BudgetConfig; segmentName: string }) {
  const [budget, setBudget] = useState(config.recommendedMonthly);
  const isMediaSegment = config.avgCPM > 0 && config.conversionRate > 0;
  const avgClientValue = 5000;

  const projections = useMemo(() => {
    if (!isMediaSegment) {
      return {
        impressions: 0,
        clicks: 0,
        leads: 0,
        costPerLead: 0,
        platformFee: config.platformFee,
        totalInvestment: budget + config.platformFee,
        projectedRevenue: 0,
        roi: 0,
      };
    }
    const adSpend = budget;
    const impressions = Math.round((adSpend / config.avgCPM) * 1000);
    const clicks = Math.round(adSpend / config.avgCPC);
    const leads = Math.round(clicks * config.conversionRate);
    const costPerLead = leads > 0 ? Math.round(adSpend / leads) : 0;
    const totalInvestment = adSpend + config.platformFee;
    const projectedRevenue = leads * avgClientValue;
    const roi = totalInvestment > 0 ? Math.round(((projectedRevenue - totalInvestment) / totalInvestment) * 100) : 0;

    return { impressions, clicks, leads, costPerLead, platformFee: config.platformFee, totalInvestment, projectedRevenue, roi };
  }, [budget, config, isMediaSegment]);

  const chartData = useMemo(() => {
    if (isMediaSegment) {
      return [
        { name: "Ad Spend", value: budget, fill: "hsl(var(--primary))" },
        { name: "Platform Fee", value: config.platformFee, fill: "hsl(var(--muted-foreground))" },
      ];
    }
    return [
      { name: "Tools & Platforms", value: config.platformFee, fill: "hsl(var(--primary))" },
      { name: "Implementation", value: Math.round(budget * 0.6), fill: "hsl(var(--muted-foreground))" },
      { name: "Optimization", value: Math.round(budget * 0.4), fill: "hsl(217 91% 60%)" },
    ];
  }, [budget, config, isMediaSegment]);

  const budgetTier = budget <= config.minMonthly + (config.recommendedMonthly - config.minMonthly) * 0.3
    ? "starter"
    : budget <= config.recommendedMonthly + (config.maxMonthly - config.recommendedMonthly) * 0.3
    ? "growth"
    : "aggressive";

  const campaignTiers: Record<string, string[]> = {
    starter: ["Brand Awareness", "Basic Retargeting"],
    growth: ["Brand Awareness", "Retargeting", "Lead Generation", "A/B Testing"],
    aggressive: ["Brand Awareness", "Retargeting", "Lead Generation", "A/B Testing", "Competitor Conquesting", "Lookalike Expansion"],
  };

  const fmt = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();
  const fmtDollar = (n: number) => `$${n.toLocaleString()}`;

  return (
    <div className="space-y-6" data-testid="tab-budget">
      {/* Budget Slider */}
      <Card className="border border-card-border">
        <CardContent className="p-5">
          <h3 className="text-sm font-display font-bold mb-1">Monthly Budget for {segmentName}</h3>
          <p className="text-xs text-muted-foreground mb-4">Drag to adjust your monthly ad spend and see projected results.</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{fmtDollar(config.minMonthly)}</span>
              <span className="text-lg font-display font-bold text-foreground">{fmtDollar(budget)}<span className="text-xs text-muted-foreground font-normal">/mo</span></span>
              <span>{fmtDollar(config.maxMonthly)}</span>
            </div>
            <Slider
              value={[budget]}
              onValueChange={(v) => setBudget(v[0])}
              min={config.minMonthly}
              max={config.maxMonthly}
              step={Math.round((config.maxMonthly - config.minMonthly) / 100) || 50}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Minimum</span>
              <span className="text-primary font-semibold">Recommended: {fmtDollar(config.recommendedMonthly)}</span>
              <span>Aggressive</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Rules */}
      {config.rules && config.rules.length > 0 && (
        <Card className="border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30">
          <CardContent className="p-5">
            <h4 className="text-sm font-display font-bold mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              Why this budget range?
            </h4>
            <div className="space-y-3">
              {config.rules.map((r, i) => (
                <div key={i} className="border-b border-blue-200/50 dark:border-blue-800/50 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-semibold text-foreground">{r.rule}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{r.detail}</p>
                  <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-1 italic">Source: {r.source}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metric Cards */}
      {isMediaSegment && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border border-card-border">
            <CardContent className="p-4 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Impressions</p>
              <p className="text-xl font-display font-bold">{fmt(projections.impressions)}</p>
            </CardContent>
          </Card>
          <Card className="border border-card-border">
            <CardContent className="p-4 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Clicks</p>
              <p className="text-xl font-display font-bold">{fmt(projections.clicks)}</p>
            </CardContent>
          </Card>
          <Card className="border border-card-border">
            <CardContent className="p-4 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Est. Leads</p>
              <p className="text-xl font-display font-bold">{projections.leads}</p>
            </CardContent>
          </Card>
          <Card className="border border-card-border">
            <CardContent className="p-4 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Cost / Lead</p>
              <p className="text-xl font-display font-bold">{fmtDollar(projections.costPerLead)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart + Campaigns side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Budget Breakdown Chart */}
        <Card className="border border-card-border">
          <CardContent className="p-4">
            <h4 className="text-sm font-display font-bold mb-3">Budget Breakdown</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${v >= 1000 ? `${v / 1000}k` : v}`} />
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Types */}
        <Card className="border border-card-border">
          <CardContent className="p-4">
            <h4 className="text-sm font-display font-bold mb-1">Campaigns Enabled</h4>
            <p className="text-[10px] text-muted-foreground mb-3">
              At {fmtDollar(budget)}/mo ({budgetTier} tier)
            </p>
            <div className="space-y-2">
              {campaignTiers[budgetTier].map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-sm">{c}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Projection */}
      {isMediaSegment && (
        <Card className="border border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <h4 className="text-sm font-display font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> ROI Projection
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Investment</p>
                <p className="text-lg font-display font-bold">{fmtDollar(projections.totalInvestment)}</p>
                <p className="text-[10px] text-muted-foreground">Ad spend + tools</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Projected Revenue</p>
                <p className="text-lg font-display font-bold text-primary">{fmtDollar(projections.projectedRevenue)}</p>
                <p className="text-[10px] text-muted-foreground">{projections.leads} leads x $5K avg value</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Net Return</p>
                <p className="text-lg font-display font-bold text-emerald-500">{fmtDollar(projections.projectedRevenue - projections.totalInvestment)}</p>
                <p className="text-[10px] text-muted-foreground">Revenue - investment</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">ROI</p>
                <p className="text-lg font-display font-bold text-emerald-500">{projections.roi}%</p>
                <p className="text-[10px] text-muted-foreground">Return on investment</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total Monthly Investment */}
      <Card className="border border-card-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-display font-bold">Total Monthly Investment</h4>
              <p className="text-xs text-muted-foreground">Ad spend ({fmtDollar(budget)}) + Platform fees ({fmtDollar(config.platformFee)})</p>
            </div>
            <p className="text-2xl font-display font-bold text-primary">{fmtDollar(projections.totalInvestment)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SegmentDetailPage() {
  const params = useParams<{ slug: string }>();
  const { toast } = useToast();

  const { data: segment, isLoading, error } = useQuery<SegmentDetail>({
    queryKey: ["/api/segments", params.slug],
    queryFn: async () => {
      const res = await fetch(`/api/segments/${params.slug}`);
      if (!res.ok) throw new Error(`Failed to load segment: ${res.status}`);
      return res.json();
    },
    enabled: !!params.slug,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("PATCH", `/api/segments/${segment!.id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/segments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Status updated" });
    },
  });

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-96 mb-6" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!segment) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">
          {error ? `Error loading segment: ${error.message}` : `Loading segment "${params.slug}"...`}
        </p>
        <WouterLink href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Overview
          </Button>
        </WouterLink>
      </div>
    );
  }

  const IconComponent = ICON_MAP[segment.icon];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Back nav */}
        <WouterLink href="/">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back-dashboard">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
        </WouterLink>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              {IconComponent && <IconComponent className="w-5 h-5 text-primary" />}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-display font-bold truncate" data-testid="text-segment-name">{segment.name}</h1>
              <p className="text-sm text-muted-foreground">{segment.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Select value={segment.status} onValueChange={(v) => updateStatusMutation.mutate(v)} data-testid="select-segment-status">
              <SelectTrigger className="w-36 h-8 text-xs" data-testid="select-trigger-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="optimizing">Optimizing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <Progress value={segment.progress} className="flex-1 h-2" />
          <span className="text-xs font-mono text-muted-foreground shrink-0">{segment.progress}%</span>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="modules" data-testid="segment-tabs">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="modules" data-testid="tab-modules">Modules</TabsTrigger>
            <TabsTrigger value="best-practices" data-testid="tab-best-practices">Best Practices</TabsTrigger>
            <TabsTrigger value="ad-platform" data-testid="tab-ad-platform">Platform</TabsTrigger>
            <TabsTrigger value="tools" data-testid="tab-tools-trigger">Tools</TabsTrigger>
            <TabsTrigger value="budget" data-testid="tab-budget-trigger">Budget</TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="mt-4 space-y-3">
            {segment.modules.length > 0 ? segment.modules.map(mod => (
              <ModuleCard key={mod.id} mod={mod} segmentId={segment.id} />
            )) : (
              <p className="text-sm text-muted-foreground italic p-4">No modules defined for this segment.</p>
            )}
          </TabsContent>

          <TabsContent value="best-practices" className="mt-4 space-y-3">
            {segment.bestPractices.length > 0 ? segment.bestPractices.map(bp => (
              <BestPracticeCard key={bp.id} bp={bp} />
            )) : (
              <Card className="border border-card-border">
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-muted-foreground">No best practices documented yet for this segment.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ad-platform" className="mt-4">
            <AdPlatformTab segmentName={segment.name} modules={segment.modules} category={segment.category} />
          </TabsContent>

          <TabsContent value="tools" className="mt-4">
            <ToolsTab tools={segment.tools || []} />
          </TabsContent>

          <TabsContent value="budget" className="mt-4">
            {segment.budgetConfig ? (
              <BudgetCalculatorTab config={segment.budgetConfig} segmentName={segment.name} />
            ) : (
              <Card className="border border-card-border">
                <CardContent className="p-6 text-center">
                  <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-muted-foreground">Budget calculator not available for this segment.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
