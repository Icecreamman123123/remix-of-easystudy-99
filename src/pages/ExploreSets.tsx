import { useState } from "react";
import { Link } from "react-router-dom";
import { useStudyTemplates, StudyTemplateRecord } from "@/hooks/useStudyTemplates-simple";
import { STUDY_TEMPLATES, StudyTemplate } from "@/lib/study-templates";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TemplatesManager } from "@/components/study/TemplatesManager";
import { TemplateUseDialog } from "@/components/study/TemplateUseDialog";
import { Sparkles, Users, BookOpen, ArrowLeft, Upload } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function ExploreSets() {
  const { templates, loading } = useStudyTemplates();
  const { t } = useI18n();
  const [templatesManagerOpen, setTemplatesManagerOpen] = useState(false);
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<StudyTemplate | null>(null);

  const publicTemplates = templates.filter((t) => t.is_public);

  const handleUseTemplate = (t: any) => {
    // If it's a community template, normalize it to StudyTemplate
    if ("payload" in t) {
      const record = t as StudyTemplateRecord;
      const normalized: StudyTemplate = {
        id: record.id,
        name: record.name,
        description: record.description || "",
        defaultTitle: record.name,
        action: record.action as any,
        defaultCount: record.estimated_count || 10,
        instructions: record.payload?.instructions || ""
      };
      setSelectedTemplate(normalized);
    } else {
      // It's already a StudyTemplate
      setSelectedTemplate(t);
    }
    setUseDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-accent rounded-full transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold tracking-tight">{t("explore.title")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setTemplatesManagerOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              {t("explore.upload")}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-12">
          {/* Built-in Templates */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">{t("explore.standardTemplates")}</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {STUDY_TEMPLATES.map((t_item) => (
                <Card key={t_item.id} className="group hover:shadow-md transition-all border-muted-foreground/10 overflow-hidden">
                  <div className="h-1.5 bg-primary/20 group-hover:bg-primary transition-colors" />
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {t_item.name}
                      <span className="text-[10px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t("explore.official")}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground min-h-[40px]">{t_item.description}</p>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5" />
                        {t_item.defaultCount || "—"} {t("explore.items")}
                      </div>
                      <Button size="sm" onClick={() => handleUseTemplate(t_item)} className="px-6 rounded-full">{t("explore.use")}</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Community Templates */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">{t("explore.communityCreators")}</h2>
            </div>
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse bg-muted h-[200px]" />
                ))}
              </div>
            ) : publicTemplates.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {publicTemplates.map((t_item) => (
                  <Card key={t_item.id} className="group hover:shadow-md transition-all border-muted-foreground/10 overflow-hidden">
                    <div className="h-1.5 bg-accent/20 group-hover:bg-accent transition-colors" />
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="truncate pr-2">{t_item.name}</span>
                        <span className="text-[10px] uppercase tracking-widest bg-accent/10 text-accent-foreground px-2 py-0.5 rounded-full shrink-0">{t("explore.community")}</span>
                      </CardTitle>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                        {t("explore.by")} {(t_item as any).profiles?.[0]?.display_name || "Anonymous User"}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground min-h-[40px]">{t_item.description}</p>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BookOpen className="h-3.5 w-3.5" />
                          {t_item.estimated_count || "—"} {t("explore.items")}
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => handleUseTemplate(t_item)} className="px-6 rounded-full">{t("explore.use")}</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-muted/30 border border-dashed rounded-xl p-12 text-center">
                <p className="text-muted-foreground">{t("explore.noCommunitySets")}</p>
              </div>
            )}
          </section>
        </div>
      </main>

      <TemplatesManager open={templatesManagerOpen} onOpenChange={setTemplatesManagerOpen} defaultIsPublic={true} />

      <TemplateUseDialog
        template={selectedTemplate}
        open={useDialogOpen}
        onOpenChange={setUseDialogOpen}
      />
    </div>
  );
}
