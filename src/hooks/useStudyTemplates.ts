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



  const { user, publisherName } = useAuth();

  const fetchTemplates = async () => {
    setLoading(true);
    let allTemplates: StudyTemplateRecord[] = [];

    // 1. Fetch public templates from Supabase
    const { data, error } = await (supabase as any)
      .from("study_templates")
      .select("*, profiles(display_name)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      allTemplates = [...data];
    } else {
      console.error("Error fetching remote templates:", error);
    }

    // 2. Fetch local templates from localStorage
    try {
      const localData = localStorage.getItem("local_study_templates");
      if (localData) {
        const localTemplates: StudyTemplateRecord[] = JSON.parse(localData);
        // Combine, prioritizing local ones if they exist (though IDs should differ)
        allTemplates = [...localTemplates, ...allTemplates];
      }
    } catch (e) {
      console.error("Error fetching local templates:", e);
    }

    // Deduplicate by ID just in case
    const uniqueTemplates = Array.from(new Map(allTemplates.map(item => [item.id, item])).values());

    // Sort combined results
    uniqueTemplates.sort((a, b) =>
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    setTemplates(uniqueTemplates);
    setLoading(false);
  };

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
    // If user is logged in, try to save to Supabase
    if (user) {
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
      return data as StudyTemplateRecord;
    } else {
      // Local Storage Fallback
      const newTemplate: StudyTemplateRecord = {
        id: `local-${Date.now()}`,
        name: t.name,
        description: t.description || null,
        action: t.action,
        payload: t.payload || {},
        estimated_count: t.estimated_count || null,
        is_public: false, // Local templates are always private/local
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Augment with publisher name if available for display
        // @ts-ignore
        profiles: publisherName ? { display_name: publisherName } : undefined
      };

      const localData = localStorage.getItem("local_study_templates");
      const localTemplates: StudyTemplateRecord[] = localData ? JSON.parse(localData) : [];
      localTemplates.push(newTemplate);
      localStorage.setItem("local_study_templates", JSON.stringify(localTemplates));

      await fetchTemplates(); // Refresh list
      return newTemplate;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<StudyTemplateRecord>) => {
    if (id.startsWith("local-")) {
      // Local Update
      const localData = localStorage.getItem("local_study_templates");
      let localTemplates: StudyTemplateRecord[] = localData ? JSON.parse(localData) : [];

      const index = localTemplates.findIndex(t => t.id === id);
      if (index !== -1) {
        localTemplates[index] = { ...localTemplates[index], ...updates, updated_at: new Date().toISOString() };
        localStorage.setItem("local_study_templates", JSON.stringify(localTemplates));
        await fetchTemplates();
        return localTemplates[index];
      }
      throw new Error("Template not found locally");
    } else {
      // Remote Update
      const { data, error } = await (supabase as any).from("study_templates").update(updates).eq("id", id).select().single();
      if (error) throw error;
      await fetchTemplates();
      return data as StudyTemplateRecord;
    }
  };

  const deleteTemplate = async (id: string) => {
    if (id.startsWith("local-")) {
      // Local Delete
      const localData = localStorage.getItem("local_study_templates");
      let localTemplates: StudyTemplateRecord[] = localData ? JSON.parse(localData) : [];
      localTemplates = localTemplates.filter(t => t.id !== id);
      localStorage.setItem("local_study_templates", JSON.stringify(localTemplates));
      await fetchTemplates();
      return true;
    } else {
      // Remote Delete
      const { error } = await (supabase as any).from("study_templates").delete().eq("id", id);
      if (error) throw error;
      await fetchTemplates();
      return true;
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