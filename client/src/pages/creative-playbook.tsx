import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Paintbrush, ArrowLeft, ExternalLink,
  CheckCircle2, AlertTriangle, Grid3x3, LayoutTemplate,
  Video, ImageIcon, MessageSquare, Tv, Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Segment, Module, BestPractice, Task } from "@shared/schema";
import { Link } from "wouter";

type ModuleWithTasks = Module & { tasks: Task[] };
type SegmentDetail = Segment & { modules: ModuleWithTasks[]; bestPractices: BestPractice[] };

const CATEGORY_COLORS: Record<string, string> = {
  framework: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  template: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  checklist: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  metric: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

const AUDIT_DIMENSIONS = [
  { key: "headline", label: "Headline Power", desc: "Does the headline stop the scroll and promise a benefit?" },
  { key: "visual", label: "Visual Stopping Power", desc: "Would this image/video make someone pause in-feed?" },
  { key: "emotion", label: "Emotional Hook", desc: "Does it trigger curiosity, fear, desire, or surprise?" },
  { key: "clarity", label: "Clarity", desc: "Can the message be understood in under 3 seconds?" },
  { key: "brand", label: "Brand Integration", desc: "Is SMAART clearly present without feeling forced?" },
  { key: "cta", label: "CTA Strength", desc: "Is the call-to-action specific, urgent, and visible?" },
  { key: "platform", label: "Platform Fit", desc: "Is the format optimized for the target platform?" },
  { key: "proof", label: "Social Proof", desc: "Does it include reviews, stats, logos, or testimonials?" },
];

const MATRIX_HEADLINES = ["Problem-Agitate", "Social Proof", "Direct Benefit"];
const MATRIX_VISUALS = ["Client Photo", "Data Visual", "Bold Typography"];

const AD_TEMPLATES = [
  {
    name: "PAS Video Script",
    icon: Video,
    format: "15-30s Video",
    content: "Hook (0-3s): 'Still doing your own books at midnight?' → Problem: Show pain of DIY accounting → Agitate: 'While your competitors use AI-powered firms...' → Solution: 'SMAART handles it all — tax, payroll, advisory.' → CTA: 'Free consult — link in bio.'",
  },
  {
    name: "Social Proof Static",
    icon: ImageIcon,
    format: "1080×1350 (4:5)",
    content: "Headline: '147 South Florida businesses trust SMAART' → Body: Star rating (4.9★) + client quote → Visual: Client headshot grid or logo wall → CTA: 'Join them — free consultation' → Badge: 'Google Guaranteed ✓'",
  },
  {
    name: "X Thread Template",
    icon: MessageSquare,
    format: "Thread (5-7 tweets)",
    content: "Tweet 1: Hook stat → Tweet 2-3: Problem breakdown → Tweet 4-5: Framework/solution → Tweet 6: Case study or proof point → Tweet 7: CTA + link to consult page. Educational tone. Value-first.",
  },
  {
    name: "CTV Script",
    icon: Tv,
    format: "30s Commercial",
    content: "0-5s: 'Your business deserves better than a seasonal accountant.' → 5-15s: Show contrast (old way vs SMAART way) → 15-25s: Feature highlights with client testimonials → 25-30s: Logo + 'smaartcompany.com — Your numbers, our mission.'",
  },
];

function CreativeAuditTool() {
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(AUDIT_DIMENSIONS.map(d => [d.key, 5]))
  );
  const { toast } = useToast();

  // Load saved scores on mount
  const { data: savedScore } = useQuery<any>({
    queryKey: ["/api/creative-scores/latest"],
    queryFn: async () => {
      const res = await fetch("/api/creative-scores/latest");
      if (!res.ok) return null;
      return res.json();
    },
  });

  useEffect(() => {
    if (savedScore && savedScore.scores) {
      try {
        const parsed = typeof savedScore.scores === "string" ? JSON.parse(savedScore.scores) : savedScore.scores;
        setScores(parsed);
      } catch {}
    }
  }, [savedScore]);

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxScore = AUDIT_DIMENSIONS.length * 10;
  const threshold = 60;
  const isReady = total >= threshold;

  const saveScoreMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/creative-scores", {
        scores,
        totalScore: total,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creative-scores/latest"] });
      toast({
        title: "Score saved",
        description: `Audit score ${total}/${maxScore} recorded — ${isReady ? "Ready to Launch" : "Needs Revision"}`,
      });
    },
  });

  const handleSaveScore = () => {
    saveScoreMutation.mutate();
  };

  return (
    <Card className="border border-card-border" data-testid="card-creative-audit">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-display font-bold">Creative Audit Tool</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Score every ad on 8 dimensions before launch</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-display font-bold" data-testid="text-audit-score">{total}<span className="text-sm text-muted-foreground font-normal">/{maxScore}</span></div>
            <Badge
              variant={isReady ? "default" : "destructive"}
              className="text-[10px] mt-1"
              data-testid="badge-audit-verdict"
            >
              {isReady ? (
                <><CheckCircle2 className="w-3 h-3 mr-1" /> Ready to Launch</>
              ) : (
                <><AlertTriangle className="w-3 h-3 mr-1" /> Needs Revision</>
              )}
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          {AUDIT_DIMENSIONS.map(dim => (
            <div key={dim.key} data-testid={`audit-dim-${dim.key}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-xs font-bold">{dim.label}</span>
                  <p className="text-[10px] text-muted-foreground">{dim.desc}</p>
                </div>
                <span className="text-sm font-mono font-bold text-primary ml-3 shrink-0">{scores[dim.key]}</span>
              </div>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[scores[dim.key]]}
                onValueChange={([v]) => setScores(s => ({ ...s, [dim.key]: v }))}
                className="w-full"
                data-testid={`slider-${dim.key}`}
              />
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
          <Progress value={(total / maxScore) * 100} className="h-2 flex-1" />
          <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5 shrink-0" onClick={handleSaveScore} data-testid="button-save-audit-score">
            <Save className="w-3.5 h-3.5" /> Save Score
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">Minimum {threshold}/{maxScore} required for launch approval</p>
      </CardContent>
    </Card>
  );
}

function TestingMatrix() {
  const STATUS_CYCLE = ["Draft", "Testing", "Winner", "Paused"];
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(
      MATRIX_HEADLINES.flatMap((h, hi) =>
        MATRIX_VISUALS.map((v, vi) => [`${hi}-${vi}`, hi === 0 && vi === 0 ? "Testing" : "Draft"])
      )
    )
  );

  const cycleStatus = (key: string) => {
    setStatuses(s => {
      const curr = STATUS_CYCLE.indexOf(s[key]);
      const next = STATUS_CYCLE[(curr + 1) % STATUS_CYCLE.length];
      const [hi, vi] = key.split("-").map(Number);
      toast({ title: `Cell ${String.fromCharCode(65 + hi)}${vi + 1} → ${next}` });
      return { ...s, [key]: next };
    });
  };

  const statusColor: Record<string, string> = {
    Draft: "bg-gray-500/10 text-gray-500",
    Testing: "bg-amber-500/10 text-amber-500",
    Winner: "bg-emerald-500/10 text-emerald-500",
    Paused: "bg-red-500/10 text-red-500",
  };

  return (
    <Card className="border border-card-border" data-testid="card-testing-matrix">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Grid3x3 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-display font-bold">3×3 Testing Matrix</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left text-muted-foreground font-medium"></th>
                {MATRIX_VISUALS.map(v => (
                  <th key={v} className="p-2 text-center font-medium text-muted-foreground">{v}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX_HEADLINES.map((h, hi) => (
                <tr key={h}>
                  <td className="p-2 font-bold whitespace-nowrap">{h}</td>
                  {MATRIX_VISUALS.map((v, vi) => {
                    const key = `${hi}-${vi}`;
                    return (
                      <td key={key} className="p-1.5">
                        <button
                          onClick={() => cycleStatus(key)}
                          className={`w-full p-2.5 rounded-lg border border-card-border text-center transition-colors ${statusColor[statuses[key]]}`}
                          data-testid={`matrix-cell-${hi}-${vi}`}
                        >
                          <span className="font-bold">{String.fromCharCode(65 + hi)}{vi + 1}</span>
                          <br />
                          <span className="text-[10px]">{statuses[key]}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 text-center">Click cells to cycle status: Draft → Testing → Winner → Paused</p>
      </CardContent>
    </Card>
  );
}

function AdTemplatePreviews() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="ad-templates-grid">
      {AD_TEMPLATES.map(tpl => (
        <Card key={tpl.name} className="border border-card-border" data-testid={`card-template-${tpl.name.toLowerCase().replace(/\s/g, "-")}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <tpl.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-display font-bold">{tpl.name}</h4>
                <span className="text-[10px] text-muted-foreground">{tpl.format}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{tpl.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CreativePlaybookPage() {
  const { data: segment, isLoading } = useQuery<SegmentDetail>({
    queryKey: ["/api/segments", "creative-playbook"],
    queryFn: async () => {
      const res = await fetch("/api/segments/creative-playbook");
      if (!res.ok) throw new Error("Failed to load creative playbook");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Back nav */}
        <Link href="/">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back-dashboard">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Paintbrush className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold" data-testid="text-playbook-title">Ad Creative Playbook</h1>
            <p className="text-sm text-muted-foreground">World-class frameworks from Ogilvy, VaynerMedia, Droga5, BBDO, Meta</p>
          </div>
        </div>

        <Tabs defaultValue="audit" data-testid="playbook-tabs">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="audit" data-testid="tab-audit">Audit Tool</TabsTrigger>
            <TabsTrigger value="matrix" data-testid="tab-matrix">3×3 Matrix</TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">Templates</TabsTrigger>
            <TabsTrigger value="frameworks" data-testid="tab-frameworks">Frameworks</TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="mt-4">
            <CreativeAuditTool />
          </TabsContent>

          <TabsContent value="matrix" className="mt-4">
            <TestingMatrix />
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <AdTemplatePreviews />
          </TabsContent>

          <TabsContent value="frameworks" className="mt-4 space-y-3">
            {segment?.bestPractices && segment.bestPractices.length > 0 ? segment.bestPractices.map(bp => (
              <Card key={bp.id} className="border border-card-border" data-testid={`card-bp-${bp.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-sm font-display font-bold">{bp.title}</h3>
                    <Badge variant="outline" className={`text-[10px] shrink-0 border ${CATEGORY_COLORS[bp.category]}`}>
                      {bp.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{bp.content}</p>
                  {bp.sourceUrl && (
                    <a href={bp.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 mt-3 text-xs text-primary hover:underline">
                      <ExternalLink className="w-3 h-3" /> {bp.source}
                    </a>
                  )}
                </CardContent>
              </Card>
            )) : (
              <p className="text-sm text-muted-foreground italic">No frameworks loaded.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
