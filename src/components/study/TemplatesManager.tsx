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
import { useToast } from "@/hooks/use-toast";
import { STUDY_TEMPLATES } from "@/lib/study-templates";
import { Globe, UploadCloud } from "lucide-react";

interface TemplatesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // If true, pre-fill create form to publish (used when uploading from Explore page)
  defaultIsPublic?: boolean;
  // Pre-fill data for creating a new template
  prefillData?: {
    name?: string;
    description?: string;
    action?: string;
    payload?: any;
  } | null;
}

export function TemplatesManager({ open, onOpenChange, defaultIsPublic = false, prefillData = null }: TemplatesManagerProps) {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useStudyTemplates();
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

  // If the dialog was opened with defaultIsPublic, start create and prefill public flag
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
    try {
      await updateTemplate(id, { is_public: publish });
      toast({ title: publish ? "Published" : "Unpublished" });
      // Refresh list is handled by updateTemplate
    } catch (err) {
      console.error(err);
      toast({ title: "Publish failed", description: String((err as Error).message || "Error"), variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 icon-gradient rounded-md">
              <UploadCloud className="h-4 w-4 text-white" />
            </div>
            Manage Study Templates
          </DialogTitle>
          <DialogDescription>Create or edit your reusable study templates.</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-5 gap-6 overflow-hidden">
          {/* Left Sidebar - Template List */}
          <div className="md:col-span-2 space-y-4 overflow-y-auto max-h-[60vh] pr-2">
            {/* Sample Templates */}
            <details className="group" open>
              <summary className="font-semibold text-sm cursor-pointer flex items-center gap-2 py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <span className="flex-1">Sample Templates</span>
                <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded">Examples</span>
              </summary>
              <div className="space-y-2 mt-3 pl-1">
                {STUDY_TEMPLATES.map((t) => (
                  <div key={t.id} className="p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors card-hover">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{t.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{t.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">{t.defaultCount || "—"} cards</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 hover-glow"
                        onClick={() => {
                          setEditing(null);
                          const payloadObj: any = {};
                          if (t.defaultCount) payloadObj.defaultCount = t.defaultCount;
                          if (t.difficulty) payloadObj.difficulty = t.difficulty;
                          setForm({
                            name: t.name,
                            description: t.description,
                            action: t.action,
                            payload: JSON.stringify(payloadObj, null, 2),
                            estimated_count: t.defaultCount || 10,
                            is_public: false,
                          });
                          setPayloadError(null);
                        }}
                      >
                        Use
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </details>

            {/* Your Templates */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                <h4 className="font-semibold text-sm">Your Templates</h4>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="default" onClick={() => startCreate(false)} className="h-7 text-xs">
                    New
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => startCreate(true)} title="Upload and publish" className="h-7 text-xs">
                    <Globe className="h-3 w-3 mr-1" />
                    Publish
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                    <p>No templates yet</p>
                    <p className="text-xs mt-1">Create one to get started</p>
                  </div>
                ) : (
                  templates.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${editing === t.id
                        ? "bg-primary/10 border-primary/50 ring-1 ring-primary/30"
                        : "bg-card hover:bg-muted/30"
                        }`}
                      onClick={() => startEdit(t)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate flex items-center gap-2">
                            {t.name}
                            {t.is_public && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary">
                                <Globe className="h-2.5 w-2.5 mr-0.5" />
                                Public
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">{t.estimated_count || "—"} cards</div>
                        </div>
                        <Button
                          size="sm"
                          variant={t.is_public ? "outline" : "default"}
                          className="h-7 text-xs shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublish(t.id, !t.is_public);
                          }}
                        >
                          {t.is_public ? "Unpublish" : "Publish"}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Editor */}
          <div className="md:col-span-3 space-y-4 overflow-y-auto max-h-[60vh] pr-2">
            <div className="p-4 border rounded-lg bg-card/50 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Template name..."
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Action Type</Label>
                  <Select value={form.action} onValueChange={(v) => setForm((s) => ({ ...s, action: v }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generate-flashcards">Generate Flashcards</SelectItem>
                      <SelectItem value="generate-quiz">Generate Quiz</SelectItem>
                      <SelectItem value="create-study-plan">Create Study Plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Brief description..."
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Payload (JSON)</Label>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={formatPayload} className="h-6 text-xs px-2">
                      Format
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { navigator.clipboard?.writeText(form.payload || ""); toast({ title: "Copied" }); }}
                      className="h-6 text-xs px-2"
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={form.payload}
                  onChange={(e) => setForm((s) => ({ ...s, payload: e.target.value }))}
                  className="font-mono text-xs min-h-[80px]"
                  placeholder='{ "defaultCount": 10 }'
                />
                {payloadError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span>⚠️</span> {payloadError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Card Count</Label>
                  <Input
                    type="number"
                    value={String(form.estimated_count)}
                    onChange={(e) => setForm((s) => ({ ...s, estimated_count: Number(e.target.value || 0) }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-medium">Visibility</Label>
                  <div className="flex items-center gap-3 h-9">
                    <Switch
                      checked={form.is_public}
                      onCheckedChange={(v) => setForm((s) => ({ ...s, is_public: !!v }))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {form.is_public ? "Public (visible to everyone)" : "Private (only you)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <details className="group">
                <summary className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                  Preview JSON →
                </summary>
                <div className="mt-2 p-3 rounded-lg bg-muted/50 border">
                  <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground max-h-[100px] overflow-auto">
                    {parsedPayload ? JSON.stringify(parsedPayload, null, 2) : "{}"}
                  </pre>
                </div>
              </details>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={!form.name.trim() || !!payloadError}
                className="hover-glow"
              >
                {editing ? "Update Template" : "Create Template"}
              </Button>
              {editing && (
                <Button variant="destructive" onClick={() => handleDelete(editing)}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
