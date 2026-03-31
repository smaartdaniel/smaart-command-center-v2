import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plug, Zap, BarChart3, Search, Code, Linkedin, Twitter, Globe,
  Plus, RefreshCw, CheckCircle2, XCircle, Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────

interface Website {
  id: number;
  name: string;
  url: string;
  division: string;
  status: string;
  gtmContainerId: string | null;
  ga4PropertyId: string | null;
  ga4MeasurementId: string | null;
  createdAt: string | null;
}

interface Connector {
  id: number;
  websiteId: number | null;
  platform: string;
  status: string;
  lastSyncAt: string | null;
  credentials: Record<string, string> | null;
  createdAt: string | null;
}

// ── Platform config ────────────────────────────────────────────────────────

const PLATFORMS = [
  { key: "ghl", name: "GoHighLevel", icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { key: "ga4", name: "Google Analytics", icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "google_ads", name: "Google Ads", icon: Search, color: "text-red-500", bg: "bg-red-500/10" },
  { key: "gtm", name: "Google Tag Manager", icon: Code, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  {
    key: "meta_ads", name: "Meta Ads", color: "text-blue-600", bg: "bg-blue-600/10",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  { key: "linkedin_ads", name: "LinkedIn Ads", icon: Linkedin, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "x_ads", name: "X (Twitter) Ads", icon: Twitter, color: "text-gray-400", bg: "bg-gray-500/10" },
] as const;

type PlatformKey = (typeof PLATFORMS)[number]["key"];

const PLATFORM_FIELDS: Record<PlatformKey, { label: string; key: string; placeholder: string }[]> = {
  ghl: [{ label: "API Key", key: "apiKey", placeholder: "Enter GoHighLevel API key" }],
  ga4: [
    { label: "Measurement ID", key: "measurementId", placeholder: "G-XXXXXXXXXX" },
    { label: "Property ID", key: "propertyId", placeholder: "123456789" },
    { label: "API Key or OAuth Token (optional)", key: "apiKey", placeholder: "For pulling live analytics data" },
  ],
  google_ads: [{ label: "API Key or OAuth Token", key: "apiKey", placeholder: "Enter Google Ads API key" }],
  gtm: [
    { label: "Container ID", key: "containerId", placeholder: "GTM-XXXXXXX" },
    { label: "API Key or OAuth Token (optional)", key: "apiKey", placeholder: "Enter GTM API key for remote management" },
  ],
  meta_ads: [
    { label: "Pixel ID", key: "pixelId", placeholder: "Enter Meta Pixel ID" },
    { label: "Ad Account ID (optional)", key: "adAccountId", placeholder: "act_XXXXXXXXX" },
    { label: "Access Token (optional)", key: "accessToken", placeholder: "For pulling ad performance data" },
  ],
  linkedin_ads: [{ label: "Access Token", key: "accessToken", placeholder: "Enter LinkedIn access token" }],
  x_ads: [{ label: "Access Token", key: "accessToken", placeholder: "Enter X access token" }],
};

const DIVISIONS = ["SMAART Company", "Construction", "Real Estate", "Insurance", "Other"];

// ── Add Website Dialog ─────────────────────────────────────────────────────

function AddWebsiteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "", url: "", division: "", gtmContainerId: "", ga4PropertyId: "", ga4MeasurementId: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/websites", {
        name: form.name,
        url: form.url,
        division: form.division,
        gtm_container_id: form.gtmContainerId || null,
        ga4_property_id: form.ga4PropertyId || null,
        ga4_measurement_id: form.ga4MeasurementId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      toast({ title: "Website added", description: `${form.name} has been registered.` });
      setForm({ name: "", url: "", division: "", gtmContainerId: "", ga4PropertyId: "", ga4MeasurementId: "" });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const setField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Website</DialogTitle>
          <DialogDescription>Register a new website to connect platforms and tracking.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</label>
            <input
              className="mt-1 w-full h-9 text-sm rounded-md border border-border bg-background px-3 shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="My Website"
              value={form.name}
              onChange={e => setField("name", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">URL</label>
            <input
              className="mt-1 w-full h-9 text-sm rounded-md border border-border bg-background px-3 shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="https://example.com"
              value={form.url}
              onChange={e => setField("url", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Division</label>
            <Select value={form.division} onValueChange={v => setField("division", v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                {DIVISIONS.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">GTM Container ID</label>
            <input
              className="mt-1 w-full h-9 text-sm rounded-md border border-border bg-background px-3 shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="GTM-XXXXXXX"
              value={form.gtmContainerId}
              onChange={e => setField("gtmContainerId", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">GA4 Property ID</label>
            <input
              className="mt-1 w-full h-9 text-sm rounded-md border border-border bg-background px-3 shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="123456789"
              value={form.ga4PropertyId}
              onChange={e => setField("ga4PropertyId", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">GA4 Measurement ID</label>
            <input
              className="mt-1 w-full h-9 text-sm rounded-md border border-border bg-background px-3 shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="G-XXXXXXXXXX"
              value={form.ga4MeasurementId}
              onChange={e => setField("ga4MeasurementId", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.name || !form.url || !form.division || mutation.isPending}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Website
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Connect Platform Dialog ────────────────────────────────────────────────

function ConnectPlatformDialog({
  open, onOpenChange, platform,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  platform: (typeof PLATFORMS)[number] | null;
}) {
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async () => {
      if (!platform) return;
      await apiRequest("POST", "/api/connectors", {
        platform: platform.key,
        display_name: platform.name,
        credentials: JSON.stringify(credentials),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connectors"] });
      toast({ title: "Connector created", description: `${platform?.name} has been connected.` });
      setCredentials({});
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (!platform) return null;

  const fields = PLATFORM_FIELDS[platform.key];
  const IconComp = platform.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${platform.bg} flex items-center justify-center`}>
              <IconComp className={`w-4 h-4 ${platform.color}`} />
            </div>
            Connect {platform.name}
          </DialogTitle>
          <DialogDescription>Enter credentials to connect {platform.name} to the Command Center.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{f.label}</label>
              <input
                type="password"
                className="mt-1 w-full h-9 text-sm rounded-md border border-border bg-background px-3 shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={f.placeholder}
                value={credentials[f.key] || ""}
                onChange={e => setCredentials(c => ({ ...c, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={fields.filter(f => !f.label.includes("optional")).some(f => !credentials[f.key]) || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Websites Tab ───────────────────────────────────────────────────────────

function WebsitesTab() {
  const [addOpen, setAddOpen] = useState(false);

  const { data: websites, isLoading } = useQuery<Website[]>({
    queryKey: ["/api/websites"],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-display font-bold">Registered Websites</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage the websites connected to your Command Center.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setAddOpen(true)} data-testid="button-add-website">
          <Plus className="w-4 h-4" />
          Add Website
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border border-card-border">
              <CardContent className="p-4"><Skeleton className="h-24" /></CardContent>
            </Card>
          ))}
        </div>
      ) : !websites?.length ? (
        <Card className="border border-card-border border-dashed">
          <CardContent className="p-8 text-center">
            <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">No websites registered yet.</p>
            <Button size="sm" variant="outline" className="mt-3 gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" />
              Add your first website
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {websites.map(site => (
            <Card key={site.id} className="border border-card-border hover:border-primary/30 transition-all duration-200 cursor-pointer group" data-testid={`card-website-${site.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${site.status === "active" ? "bg-emerald-400" : "bg-red-400"}`} />
                    <h3 className="text-sm font-display font-bold truncate">{site.name}</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{site.division}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate mb-3">{site.url}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {site.gtmContainerId && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Code className="w-3 h-3" />
                      {site.gtmContainerId}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddWebsiteDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

// ── Connectors Tab ─────────────────────────────────────────────────────────

function ConnectorsTab() {
  const { toast } = useToast();
  const [connectPlatform, setConnectPlatform] = useState<(typeof PLATFORMS)[number] | null>(null);

  const { data: connectors, isLoading } = useQuery<Connector[]>({
    queryKey: ["/api/connectors"],
  });

  const testMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/connectors/${id}`, { action: "test" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connectors"] });
      toast({ title: "Connection test passed" });
    },
    onError: (err: Error) => {
      toast({ title: "Connection test failed", description: err.message, variant: "destructive" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/connectors/${id}`, { action: "sync" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connectors"] });
      toast({ title: "Sync complete" });
    },
    onError: (err: Error) => {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    },
  });

  const connectorMap = new Map<string, Connector>();
  connectors?.forEach(c => connectorMap.set(c.platform, c));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-display font-bold">Available Connectors</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Connect external platforms to centralize your marketing data.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border border-card-border">
              <CardContent className="p-4"><Skeleton className="h-28" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PLATFORMS.map(platform => {
            const connector = connectorMap.get(platform.key);
            const isConnected = connector?.status === "connected";
            const IconComp = platform.icon;

            return (
              <Card
                key={platform.key}
                className={`border transition-all duration-200 ${isConnected ? "border-emerald-500/30 border-card-border" : "border-card-border"}`}
                data-testid={`card-connector-${platform.key}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg ${platform.bg} flex items-center justify-center shrink-0`}>
                      <IconComp className={`w-5 h-5 ${platform.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-display font-bold">{platform.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        {isConnected ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[11px] text-emerald-500 font-medium">Connected</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-[11px] text-muted-foreground">Disconnected</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {connector?.lastSyncAt && (
                    <p className="text-[10px] text-muted-foreground mb-3">
                      Last sync: {new Date(connector.lastSyncAt).toLocaleString()}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1.5 flex-1"
                          onClick={() => testMutation.mutate(connector!.id)}
                          disabled={testMutation.isPending}
                          data-testid={`button-test-${platform.key}`}
                        >
                          {testMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Test
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1.5 flex-1"
                          onClick={() => syncMutation.mutate(connector!.id)}
                          disabled={syncMutation.isPending}
                          data-testid={`button-sync-${platform.key}`}
                        >
                          {syncMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          Sync
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className="text-xs gap-1.5 w-full"
                        onClick={() => setConnectPlatform(platform)}
                        data-testid={`button-connect-${platform.key}`}
                      >
                        <Plug className="w-3.5 h-3.5" />
                        Connect
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConnectPlatformDialog
        open={!!connectPlatform}
        onOpenChange={v => { if (!v) setConnectPlatform(null); }}
        platform={connectPlatform}
      />
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function Connectors() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-xl font-display font-bold" data-testid="text-connectors-title">Connectors</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your websites and platform integrations.</p>
        </div>

        <Tabs defaultValue="websites">
          <TabsList>
            <TabsTrigger value="websites" data-testid="tab-websites">Websites</TabsTrigger>
            <TabsTrigger value="connectors" data-testid="tab-connectors">Connectors</TabsTrigger>
          </TabsList>
          <TabsContent value="websites">
            <WebsitesTab />
          </TabsContent>
          <TabsContent value="connectors">
            <ConnectorsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
