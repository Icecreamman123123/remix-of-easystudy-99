import { useState, useEffect } from "react";
import { StudyTemplate, saveTemplate, getTemplates, updateTemplate, deleteTemplate as deleteTemplateStorage } from "@/lib/storage-simple";
import { useAuth } from "./useAuth-simple";
import { useToast } from "./use-toast";

export interface StudyTemplateRecord {
  id: string;
  user_id?: string | null;
  name: string;
  description?: string | null;
  action: string;
  payload?: unknown;
  estimated_count?: number | null;
  is_public?: boolean;
  profiles?: {
    display_name?: string | null;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export function useStudyTemplates() {
  const [templates, setTemplates] = useState<StudyTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const allTemplates = getTemplates();
      // Convert to expected format
      const formattedTemplates: StudyTemplateRecord[] = allTemplates.map(template => ({
        id: template.id,
        user_id: user?.id || null,
        name: template.name,
        description: template.description || null,
        action: template.action,
        payload: template.payload,
        estimated_count: template.estimatedCount || null,
        is_public: template.isPublic || false,
        created_at: template.createdAt,
        updated_at: template.updatedAt
      }));
      
      setTemplates(formattedTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  const createTemplate = async (t: {
    name: string;
    description?: string;
    action: string;
    payload?: unknown;
    estimated_count?: number;
    is_public?: boolean;
  }) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save templates.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const newTemplate = saveTemplate({
        name: t.name,
        description: t.description,
        action: t.action,
        payload: t.payload,
        estimatedCount: t.estimated_count,
        isPublic: t.is_public
      });

      await fetchTemplates();
      toast({
        title: "Template Saved",
        description: "Your study template has been saved locally.",
      });
      
      // Convert to expected format
      return {
        id: newTemplate.id,
        user_id: user.id,
        name: newTemplate.name,
        description: newTemplate.description,
        action: newTemplate.action,
        payload: newTemplate.payload,
        estimated_count: newTemplate.estimatedCount,
        is_public: newTemplate.isPublic,
        created_at: newTemplate.createdAt,
        updated_at: newTemplate.updatedAt
      } as StudyTemplateRecord;
    } catch (error) {
      console.error("Error creating template:", error);
      toast({
        title: "Error",
        description: "Failed to save template.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<StudyTemplateRecord>) => {
    if (!user) return null;

    try {
      // Convert to storage format
      const storageUpdates = {
        name: updates.name,
        description: updates.description,
        action: updates.action,
        payload: updates.payload,
        estimatedCount: updates.estimated_count,
        isPublic: updates.is_public
      };

      const updated = updateTemplate(id, storageUpdates);
      if (updated) {
        await fetchTemplates();
        // Convert back to expected format
        return {
          id: updated.id,
          user_id: user.id,
          name: updated.name,
          description: updated.description,
          action: updated.action,
          payload: updated.payload,
          estimated_count: updated.estimatedCount,
          is_public: updated.isPublic,
          created_at: updated.createdAt,
          updated_at: updated.updatedAt
        } as StudyTemplateRecord;
      }
      throw new Error("Template not found");
    } catch (error) {
      console.error("Error updating template:", error);
      toast({
        title: "Error",
        description: "Failed to update template.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!user) return false;

    try {
      const success = deleteTemplateStorage(id);
      if (success) {
        await fetchTemplates();
        toast({
          title: "Template Deleted",
          description: "Template removed successfully.",
        });
        return true;
      }
      throw new Error("Template not found");
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    templates,
    loading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
