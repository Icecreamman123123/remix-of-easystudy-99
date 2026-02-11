import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStudyTemplates } from "@/hooks/useStudyTemplates";
import { useAuth } from "@/hooks/useAuth-simple";
import { useToast } from "@/hooks/use-toast";
import { STUDY_TEMPLATES } from "@/lib/study-templates";
import { Globe, UploadCloud, User, Sparkles } from "lucide-react";

interface TemplatesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultIsPublic?: boolean;
  prefillData?: {
    name?: string;
    description?: string;
    action?: string;
    payload?: any;
  } | null;
}

export function TemplatesManager({ open, onOpenChange, defaultIsPublic = false, prefillData = null }: TemplatesManagerProps) {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useStudyTemplates();
  const { user, publisherName, setPublisherName } = useAuth();
  const { toast } = useToast();

  const [editing, setEditing] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    description: "",
    action: "generate-flashcards",
    payload: "{}",
    estimated_count: 10,
    is_public: false,
  });

  const [localPublisherName, setLocalPublisherName] = React.useState(publisherName);

  // Sync local state with context when context changes or dialog opens
  React.useEffect(() => {
    setLocalPublisherName(publisherName);
  }, [publisherName, open]);

  const [payloadError, setPayloadError] = React.useState<string | null>(null);

  const validatePayload = (payload: string) => {
    try {
      JSON.parse(payload || "{}");
      setPayloadError(null);
      return true;
    } catch (err) {
      setPayloadError(String((err as Error).message || "Invalid JSON"));
      return false;
    }
  };

  React.useEffect(() => {
    validatePayload(form.payload);
  }, [form.payload]);

  const formatPayload = () => {
    try {
      const p = JSON.parse(form.payload || "{}");
      setForm((s) => ({ ...s, payload: JSON.stringify(p, null, 2) }));
      setPayloadError(null);
    } catch (err) {
      setPayloadError(String((err as Error).message || "Invalid JSON"));
    }
  };

  const parsedPayload = React.useMemo(() => {
    try {
      return JSON.parse(form.payload || "{}");
    } catch {
      return null;
    }
  }, [form.payload]);

  const startCreate = (prefillPublic = false) => {
    setEditing(null);
    setForm({ name: "", description: "", action: "generate-flashcards", payload: "{}", estimated_count: 10, is_public: !!prefillPublic });
    setPayloadError(null);
  };

  React.useEffect(() => {
    if (open) {
      if (prefillData) {
        setEditing(null);
        setForm({
          name: prefillData.name || "",
          description: prefillData.description || "",
          action: prefillData.action || "generate-flashcards",
          payload: prefillData.payload ? JSON.stringify(prefillData.payload, null, 2) : "{}",
          estimated_count: 10,
          is_public: !!defaultIsPublic,
        });
        setPayloadError(null);
      } else if (defaultIsPublic) {
        startCreate(true);
      }
    }
  }, [open, defaultIsPublic, prefillData]);

  const startEdit = (t: any) => {
    setEditing(t.id);
    setForm({
      name: t.name || "",
      description: t.description || "",
      action: t.action || "generate-flashcards",
      payload: JSON.stringify(t.payload || {}, null, 2),
      estimated_count: t.estimated_count || 10,
      is_public: !!t.is_public,
    });
  };

  const handleSave = async () => {
    // Save publisher name if provided and changed
    if (localPublisherName && localPublisherName !== publisherName) {
      setPublisherName(localPublisherName);
    }

    try {
      const parsed = JSON.parse(form.payload || "{}");
      if (editing) {
        const updated = await updateTemplate(editing, {
          name: form.name,
          description: form.description,
          action: form.action,
          payload: parsed,
          estimated_count: form.estimated_count,
          is_public: form.is_public,
        });
        toast({ title: "Template updated" });
        setEditing(updated.id);
        setForm((s) => ({ ...s, payload: JSON.stringify(parsed, null, 2) }));
      } else {
        const created = await createTemplate({
          name: form.name,
          description: form.description,
          action: form.action,
          payload: parsed,
          estimated_count: form.estimated_count,
          is_public: form.is_public,
        });
        toast({ title: "Template created" });
        setEditing(created.id);
        setForm((s) => ({ ...s, payload: JSON.stringify(parsed, null, 2) }));
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Failed", description: String((err as Error).message || "Error"), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try {
      await deleteTemplate(id);
      toast({ title: "Deleted" });
      setEditing(null);
      setForm({ name: "", description: "", action: "generate-flashcards", payload: "{}", estimated_count: 10, is_public: false });
      setPayloadError(null);
    } catch (err) {
      toast({ title: "Delete failed", description: String((err as Error).message || "Error"), variant: "destructive" });
    }
  };

  const handlePublish = async (id: string, publish: boolean) => {
    // If local template, cannot publish directly without backend support for upgrading
    if (id.startsWith("local-")) {
      toast({
        title: "Feature unavailable",
        description: "Local templates cannot be published globally yet.",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateTemplate(id, { is_public: publish });
      toast({ title: publish ? "Published" : "Unpublished" });
    } catch (err) {
      console.error(err);
      toast({ title: "Publish failed", description: String((err as Error).message || "Error"), variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 gap-0 border-none shadow-2xl bg-background/95 backdrop-blur-xl">
        <DialogHeader className="p-6 pb-2 border-b bg-muted/20">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            Study Templates
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground ml-11">
            Create, manage and share your custom study workflows.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-5 h-[calc(90vh-130px)] divide-x divide-border/50">
          {/* Left Sidebar - Template List */}
          <div className="md:col-span-2 flex flex-col overflow-hidden bg-muted/10">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-background/50 backdrop-blur z-10">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">My Library</h4>
              <Button size="sm" onClick={() => startCreate(false)} className="rounded-full h-8 px-4 text-xs font-semibold shadow-none">
                + New Template
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Sign In Prompt (Guest) */}
              {!user && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <User className="h-4 w-4" />
                    Sign In Required
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">
                      You must be signed in to create and save study templates to the cloud.
                    </p>
                    <Button size="sm" className="w-full text-xs" onClick={() => (window.location.href = "/auth")}>
                      Sign In / Sign Up
                    </Button>
                  </div>
                </div>
              )}

              {/* Your Templates */}
              <div>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading...
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-10 px-4 rounded-xl border border-dashed bg-muted/20">
                    <p className="font-medium text-muted-foreground">No templates found</p>
                    {user ? (
                      <>
                        <p className="text-xs text-muted-foreground mt-1">Create one to get started</p>
                        <Button variant="link" size="sm" onClick={() => startCreate(false)}>Create New</Button>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Sign in to view your templates</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {templates.map((t) => (
                      <div
                        key={t.id}
                        className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer group relative ${editing === t.id
                          ? "bg-primary/5 border-primary shadow-sm"
                          : "bg-card hover:bg-muted/50 hover:border-primary/50 hover:shadow-md"
                          }`}
                        onClick={() => startEdit(t)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="font-semibold text-base truncate flex items-center gap-2">
                              {t.name}
                              {t.is_public && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-sky-500/10 text-sky-600 border border-sky-200">
                                  Public
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{t.description}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                              <span className="px-2 py-0.5 rounded-md bg-muted font-medium">{t.estimated_count || "—"} cards</span>
                              {/* Show publisher name if available */}
                              {(t as any).profiles?.display_name && (
                                <span className="flex items-center gap-1 text-primary/70">
                                  <User className="h-3 w-3" />
                                  {(t as any).profiles.display_name}
                                </span>
                              )}
                              {/* Date */}
                              {t.created_at && (
                                <span className="text-muted-foreground/50 ml-auto">
                                  {new Date(t.created_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sample Templates Section moved to bottom or separate tab if needed, keeping it here for now */}
              <div className="pt-4 border-t">
                <h5 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3">Community Examples</h5>
                <div className="space-y-2">
                  {STUDY_TEMPLATES.slice(0, 3).map((t) => (
                    <div key={t.id} className="p-3 rounded-xl border bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => {
                      setEditing(null);
                      setForm({
                        name: t.name,
                        description: t.description,
                        action: t.action,
                        payload: JSON.stringify({ defaultCount: t.defaultCount, difficulty: t.difficulty }, null, 2),
                        estimated_count: t.defaultCount || 10,
                        is_public: false,
                      });
                    }}>
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Editor */}
          <div className="md:col-span-3 flex flex-col bg-background h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{editing ? "Edit Template" : "New Template"}</h3>
                <p className="text-sm text-muted-foreground">Configure how your content is generated.</p>
              </div>

              {!user && !editing && (
                <div className="p-6 rounded-xl bg-muted/30 border border-dashed flex flex-col items-center justify-center text-center gap-4">
                  <div className="p-4 bg-background rounded-full shadow-sm">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <h4 className="font-medium">Sign in to Create Templates</h4>
                    <p className="text-sm text-muted-foreground">
                      You need to be signed in to create, save, and share your own study templates.
                    </p>
                  </div>
                  <Button onClick={() => (window.location.href = "/auth")}>
                    Sign In
                  </Button>
                </div>
              )}

              {(user || editing) && (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Template Name</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                        placeholder="e.g., AP Biology Flashcards"
                        className="bg-muted/10"
                        disabled={!user}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Action Type</Label>
                      <Select value={form.action} onValueChange={(v) => setForm((s) => ({ ...s, action: v }))} disabled={!user}>
                        <SelectTrigger className="bg-muted/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="generate-flashcards">Generate Flashcards</SelectItem>
                          <SelectItem value="generate-quiz">Generate Quiz</SelectItem>
                          <SelectItem value="create-study-plan">Create Study Plan</SelectItem>
                          <SelectItem value="create-cornell-notes">Generate Cornell Notes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={form.description}
                      onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                      placeholder="What does this template do?"
                      className="bg-muted/10"
                      disabled={!user}
                    />
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <Label>Configuration (JSON Payload)</Label>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setForm(s => ({ ...s, payload: JSON.stringify(JSON.parse(s.payload || "{}"), null, 2) }))} disabled={!user}>Format</Button>
                      </div>
                    </div>
                    <div className="relative">
                      <Textarea
                        value={form.payload}
                        onChange={(e) => setForm((s) => ({ ...s, payload: e.target.value }))}
                        className="font-mono text-sm min-h-[200px] bg-muted/10 resize-none"
                        placeholder='{ "defaultCount": 10 }'
                        disabled={!user}
                      />
                      {payloadError && (
                        <div className="absolute bottom-4 right-4 text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded shadow-sm animate-in fade-in slide-in-from-bottom-1">
                          Invalid JSON
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                      <Label>Est. Cards/Items</Label>
                      <Input
                        type="number"
                        value={String(form.estimated_count)}
                        onChange={(e) => setForm((s) => ({ ...s, estimated_count: Number(e.target.value || 0) }))}
                        className="bg-muted/10"
                        disabled={!user}
                      />
                    </div>

                    {user && (
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="space-y-0.5">
                          <Label className="text-base">Public Template</Label>
                          <p className="text-xs text-muted-foreground">Share with the community</p>
                        </div>
                        <Switch
                          checked={form.is_public}
                          onCheckedChange={(v) => setForm((s) => ({ ...s, is_public: !!v }))}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t bg-muted/10 flex items-center justify-between">
              {editing && user && (
                <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(editing)}>
                  Delete Template
                </Button>
              )}
              <div className="flex gap-3 ml-auto">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={!!payloadError || !form.name.trim() || !user} className="min-w-[120px]">
                  {editing ? "Save Changes" : "Create Template"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
