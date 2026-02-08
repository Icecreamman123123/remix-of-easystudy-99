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

interface TemplatesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplatesManager({ open, onOpenChange }: TemplatesManagerProps) {
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

  const startCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", action: "generate-flashcards", payload: "{}", estimated_count: 10, is_public: false });
  };

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
        await updateTemplate(editing, {
          name: form.name,
          description: form.description,
          action: form.action,
          payload: parsed,
          estimated_count: form.estimated_count,
          is_public: form.is_public,
        });
        toast({ title: "Template updated" });
      } else {
        await createTemplate({
          name: form.name,
          description: form.description,
          action: form.action,
          payload: parsed,
          estimated_count: form.estimated_count,
          is_public: form.is_public,
        });
        toast({ title: "Template created" });
      }
      setForm({ name: "", description: "", action: "generate-flashcards", payload: "{}", estimated_count: 10, is_public: false });
      setEditing(null);
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
    } catch (err) {
      toast({ title: "Delete failed", description: String((err as Error).message || "Error"), variant: "destructive" });
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Your Templates</h4>
                <Button size="sm" onClick={startCreate}>New</Button>
              </div>

              <div className="space-y-2 max-h-[340px] overflow-auto mt-2">
                {loading ? (
                  <p>Loading...</p>
                ) : templates.length === 0 ? (
                  <p className="text-muted-foreground">No templates yet</p>
                ) : (
                  templates.map((t) => (
                    <div key={t.id} className="p-2 border rounded hover:bg-muted/50 cursor-pointer" onClick={() => startEdit(t)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{t.name}</div>
                          <div className="text-sm text-muted-foreground">{t.description}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{t.estimated_count || "—"} cards</div>
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
                <Textarea value={form.payload} onChange={(e) => setForm((s) => ({ ...s, payload: e.target.value }))} />
                <p className="text-xs text-muted-foreground mt-1">Provide JSON with defaults (e.g., {`{ "defaultCount": 10, "difficulty": "medium" }`}).</p>
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

              <div className="flex gap-2">
                <Button onClick={handleSave}>Save</Button>
                {editing && <Button variant="destructive" onClick={() => handleDelete(editing)}>Delete</Button>}
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
