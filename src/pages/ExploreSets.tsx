import { useState } from "react";
import { Link } from "react-router-dom";
import { useStudyTemplates } from "@/hooks/useStudyTemplates";
import { STUDY_TEMPLATES } from "@/lib/study-templates";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TemplatesManager } from "@/components/study/TemplatesManager";
import { SaveDeckDialog } from "@/components/study/SaveDeckDialog";

export default function ExploreSets() {
  const { templates, loading } = useStudyTemplates();
  const [templatesManagerOpen, setTemplatesManagerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewCards, setPreviewCards] = useState<any[]>([]);

  const publicTemplates = templates.filter((t) => t.is_public);

  const handleUseTemplate = async (t: any) => {
    try {
      const { generateTemplateDeck } = await import("@/lib/study-templates");
      // Built-in template id or map user action to built-in when possible
      const templateId = (t.id && STUDY_TEMPLATES.find(s => s.id === t.id)) ? t.id : (t.action === "generate-flashcards" ? "exam-revision" : t.action);
      const { title, flashcards } = await generateTemplateDeck(templateId, "", undefined);
      setPreviewTitle(title);
      setPreviewCards(flashcards);
      setPreviewOpen(true);
    } catch (err) {
      console.error("Failed to use template:", err);
      alert("Failed to generate from template");
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Explore Sets</h1>
        <div className="flex gap-2">
          <Button onClick={() => setTemplatesManagerOpen(true)}>Upload Set</Button>
          <Button asChild variant="outline"><Link to="/">Back</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STUDY_TEMPLATES.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle>{t.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{t.defaultCount || "—"} cards</div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUseTemplate(t)}>Use</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {loading ? <div>Loading community sets...</div> : (
          publicTemplates.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <CardTitle>{t.name}</CardTitle>
                <div className="text-xs text-muted-foreground">by {(t as any).profiles?.[0]?.display_name || "Anonymous"}</div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">{t.estimated_count || "—"} cards</div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUseTemplate(t)}>Use</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <TemplatesManager open={templatesManagerOpen} onOpenChange={setTemplatesManagerOpen} defaultIsPublic={true} />

      <SaveDeckDialog open={previewOpen} onOpenChange={setPreviewOpen} flashcards={previewCards} topic={previewTitle} />
    </div>
  );
}
