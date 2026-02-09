import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface StudyTemplateRecord {
  id: string;
  user_id?: string | null;
  name: string;
  description?: string | null;
  action: string;
  payload?: any;
  estimated_count?: number | null;
  is_public?: boolean;
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
      // Fetch public templates or user's own templates
      let query = (supabase as any)
        .from("study_templates")
        .select("*, profiles(display_name)")
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Deduplicate by ID
      const uniqueTemplates = Array.from(new Map((data || []).map(item => [item.id, item])).values());
      setTemplates(uniqueTemplates as StudyTemplateRecord[]);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error loading templates",
        description: "Could not load templates from the server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [user]); // Refetch when user changes

  const createTemplate = async (t: {
    name: string;
    description?: string;
    action: string;
    payload?: any;
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
      const { data, error } = await (supabase as any).from("study_templates").insert({
        name: t.name,
        description: t.description || null,
        action: t.action,
        payload: t.payload || {},
        estimated_count: t.estimated_count || null,
        is_public: t.is_public || false,
        user_id: user.id,
      }).select().single();

      if (error) throw error;

      await fetchTemplates();
      toast({
        title: "Template Saved",
        description: "Your study template has been saved to the cloud.",
      });
      return data as StudyTemplateRecord;
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
      const { data, error } = await supabase
        .from("study_templates")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id) // Security check
        .select()
        .single();

      if (error) throw error;

      await fetchTemplates();
      return data as StudyTemplateRecord;
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
      const { error } = await supabase
        .from("study_templates")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id); // Security check

      if (error) throw error;

      await fetchTemplates();
      toast({
        title: "Template Deleted",
        description: "Template removed successfully.",
      });
      return true;
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