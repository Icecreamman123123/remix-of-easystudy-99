import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

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

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("study_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      setTemplates([]);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const { user } = useAuth();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const createTemplate = async (t: {
    name: string;
    description?: string;
    action: string;
    payload?: any;
    estimated_count?: number;
    is_public?: boolean;
  }) => {
    const { data, error } = await (supabase as any).from("study_templates").insert({
      name: t.name,
      description: t.description || null,
      action: t.action,
      payload: t.payload || {},
      estimated_count: t.estimated_count || null,
      is_public: t.is_public || false,
      user_id: user?.id,
    }).select().single();

    if (error) {
      console.error("Create template error:", error);
      throw error;
    }

    await fetchTemplates();
    return data as StudyTemplateRecord;
  };

  const updateTemplate = async (id: string, updates: Partial<StudyTemplateRecord>) => {
    const { data, error } = await (supabase as any).from("study_templates").update(updates).eq("id", id).select().single();
    if (error) {
      console.error("Update template error:", error);
      throw error;
    }
    await fetchTemplates();
    return data as StudyTemplateRecord;
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await (supabase as any).from("study_templates").delete().eq("id", id);
    if (error) {
      console.error("Delete template error:", error);
      throw error;
    }
    await fetchTemplates();
    return true;
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