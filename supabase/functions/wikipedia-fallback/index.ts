import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { tryWikipediaFallback, formatWikipediaForAction } from "./handler.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { topic, action, difficulty } = await req.json();

        if (!topic) {
            return new Response(JSON.stringify({ error: "Topic is required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const result = await tryWikipediaFallback(topic);

        if (!result.success) {
            return new Response(JSON.stringify({ error: "Could not find Wikipedia content for topic" }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const formatted = formatWikipediaForAction(action, result.content, result.source, difficulty);

        return new Response(JSON.stringify({ success: true, result: formatted, source: "wikipedia" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Wikipedia edge function error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
