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
}

export function TemplatesManager({ open, onOpenChange, defaultIsPublic = false }: TemplatesManagerProps) {
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
    if (open && defaultIsPublic) {
      startCreate(true);
    }
  }, [open, defaultIsPublic]);

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Study Templates</DialogTitle>
          <DialogDescription>Create or edit your reusable study templates.</DialogDescription>
        </DialogHeader>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="col-span-1">
            {/* Sample / Built-in templates */}
            <details className="mb-4 group" open>
              <summary className="font-semibold flex items-center justify-between cursor-pointer">
                <span>Sample Templates <span className="text-xs text-muted-foreground ml-2">(examples)</span></span>
                <span className="text-xs text-muted-foreground">Examples</span>
              </summary>
              <div className="space-y-2 max-h-[140px] overflow-auto mt-2 pt-2">
                {STUDY_TEMPLATES.map((t) => (
                  <div key={t.id} className="p-2 border rounded bg-muted/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-sm text-muted-foreground">{t.description}</div>
                        {t.preview && <div className="text-xs italic text-muted-foreground mt-1">{t.preview}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground mr-2">{t.defaultCount || "—"} cards</div>
                        <Button size="sm" onClick={() => {
                          // Prefill the create form with this sample template
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
                        }}>Use</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Your Templates</h4>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => startCreate(false)}>New</Button>
                  <Button size="sm" variant="ghost" onClick={() => startCreate(true)} title="Upload and publish" className="ml-2">
                    <UploadCloud className="h-4 w-4 mr-2" />
                    Upload & Publish
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-[340px] overflow-auto mt-2">
                {loading ? (
                  <p>Loading...</p>
                ) : templates.length === 0 ? (
                  <p className="text-muted-foreground">No templates yet</p>
                ) : (
                  templates.map((t) => (
                    <div key={t.id} className={`p-2 border rounded hover:bg-muted/50 cursor-pointer ${editing === t.id ? "bg-muted/60 ring-2 ring-primary" : ""}`} onClick={() => startEdit(t)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{t.name} {(t as any).profiles?.display_name && <span className="text-xs text-muted-foreground ml-1">by {(t as any).profiles.display_name}</span>}</div>
                          <div className="text-sm text-muted-foreground">{t.description}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground">{t.estimated_count || "—"} cards</div>
                          {t.is_public ? (
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handlePublish(t.id, false); }} className="h-7 text-xs px-2">
                              <Globe className="h-3 w-3 mr-1" /> Unpublish
                            </Button>
                          ) : (
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); handlePublish(t.id, true); }} className="h-7 text-xs px-2">
                              <Globe className="h-3 w-3 mr-1" /> Publish
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
              </div>

              <div>
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
              </div>

              <div>
                <Label>Action</Label>
                <Select value={form.action} onValueChange={(v) => setForm((s) => ({ ...s, action: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generate-flashcards">Generate Flashcards</SelectItem>
                    <SelectItem value="generate-quiz">Generate Quiz</SelectItem>
                    <SelectItem value="create-study-plan">Create Study Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Payload (JSON)</Label>
                <div className="flex gap-4">
                  <Textarea value={form.payload} onChange={(e) => setForm((s) => ({ ...s, payload: e.target.value }))} className="font-mono text-sm" />
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="ghost" onClick={formatPayload}>Format</Button>
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard?.writeText(form.payload || ""); toast({ title: "Copied" }); }}>Copy</Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Provide JSON with defaults (e.g., {`{ "defaultCount": 10, "difficulty": "medium" }`}).</p>
                {payloadError && <p className="text-xs text-destructive mt-1">{payloadError}</p>}

                <div className="mt-2">
                  <Label>Preview</Label>
                  <div className="bg-surface p-3 rounded text-xs font-mono max-h-[200px] overflow-auto">
                    <pre className="whitespace-pre-wrap">{parsedPayload ? JSON.stringify(parsedPayload, null, 2) : "{}"}</pre>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <Label>Estimated count</Label>
                  <Input type="number" value={String(form.estimated_count)} onChange={(e) => setForm((s) => ({ ...s, estimated_count: Number(e.target.value || 0) }))} />
                </div>
                <div>
                  <Label>Public</Label>
                  <Switch checked={form.is_public} onCheckedChange={(v) => setForm((s) => ({ ...s, is_public: !!v }))} />
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <Button onClick={handleSave} disabled={!form.name.trim() || !!payloadError}>Save</Button>
                {editing && <Button variant="destructive" onClick={() => handleDelete(editing)}>Delete</Button>}
                <Button variant="ghost" size="sm" onClick={formatPayload}>Format JSON</Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
