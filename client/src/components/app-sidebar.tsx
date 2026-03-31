import { useQuery } from "@tanstack/react-query";
import { useHashLocation } from "wouter/use-hash-location";
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
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  LayoutDashboard, Database, Smartphone, MapPin, Layout, Tv, Search,
  BookOpen, Handshake, Mail, Activity, BarChart3, Paintbrush, Crosshair,
  ChevronDown, Twitter, ExternalLink, LogOut,
} from "lucide-react";
import type { Segment } from "@shared/schema";
import { useAuth } from "@/App";

const ICON_MAP: Record<string, any> = {
  Database, Smartphone, MapPin, Layout, Tv, Search, BookOpen, Handshake,
  Mail, Activity, BarChart3, Paintbrush, Crosshair, Twitter,
  Facebook: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
};

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-gray-400",
  in_progress: "bg-amber-400",
  active: "bg-emerald-400",
  optimizing: "bg-blue-400",
};


type SegmentWithCount = Segment & { moduleCount: number };

export function AppSidebar() {
  const [location, navigate] = useHashLocation();
  const { user, logout } = useAuth();
  const { data: segmentsList } = useQuery<SegmentWithCount[]>({
    queryKey: ["/api/segments"],
  });

  const strategies = segmentsList?.filter(s => s.category === "strategy") || [];
  const operations = segmentsList?.filter(s => s.category === "operations") || [];
  const intelligence = segmentsList?.filter(s => s.category === "intelligence") || [];

  const renderSegmentItem = (seg: SegmentWithCount) => {
    const IconComponent = ICON_MAP[seg.icon];
    const isActive = location === `/segment/${seg.slug}`;
    return (
      <SidebarMenuItem key={seg.slug}>
        <SidebarMenuButton
          isActive={isActive}
          data-testid={`nav-segment-${seg.slug}`}
          onClick={() => navigate(`/segment/${seg.slug}`)}
          className="cursor-pointer"
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_COLORS[seg.status]}`} />
            {IconComponent && (typeof IconComponent === "function" ? <IconComponent className="w-4 h-4 shrink-0 opacity-60" /> : <IconComponent className="w-4 h-4 shrink-0 opacity-60" />)}
            <span className="truncate text-sm">{seg.name}</span>
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar data-testid="app-sidebar">
      <SidebarHeader className="px-4 pt-4 pb-1">
        <div className="cursor-pointer" onClick={() => navigate("/")} data-testid="nav-logo">
          <img src="/assets/Smaart-Company-Logos-white-and-Navy.png" alt="SMAART Company" className="max-w-[160px] object-contain dark:hidden" />
          <img src="/assets/Smaart-Company-Logos-white.png" alt="SMAART Company" className="max-w-[160px] object-contain hidden dark:block" />
        </div>
        <span className="text-[10px] text-muted-foreground tracking-widest uppercase mt-1 px-2">Command Center</span>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Overview */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location === "/"}
                  data-testid="nav-dashboard"
                  onClick={() => navigate("/")}
                  className="cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4 opacity-60" />
                  <span className="text-sm">Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Strategies */}
        <Collapsible defaultOpen>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-group-strategies">
                Strategies
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {strategies.map(renderSegmentItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Operations */}
        <Collapsible defaultOpen>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-group-operations">
                Operations
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {operations.map(renderSegmentItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Intelligence */}
        <Collapsible defaultOpen>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-group-intelligence">
                Intelligence
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {intelligence.map(renderSegmentItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter className="px-4 pb-4">
        {user && (
          <div className="mb-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
            <button
              onClick={() => logout()}
              className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Sign Out"
              data-testid="button-sign-out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="px-1.5 py-0.5 rounded bg-muted font-mono" data-testid="text-version">v3.0</span>
          <a href="https://smaartcompany.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors" data-testid="link-smaart-company">
            SMAART Company <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
