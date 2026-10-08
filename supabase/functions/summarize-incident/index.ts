// Supabase Edge Function: summarize-incident
// Serves POST requests to summarize a resolved emergency incident using Anthropic Claude or a structured fallback.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  incident_id: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { incident_id } = (await req.json()) as RequestBody;

    if (!incident_id) {
      return new Response(
        JSON.stringify({ error: "incident_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch incident details with reporter and volunteer info
    const { data: incident, error: fetchErr } = await supabase
      .from("incidents_with_coords")
      .select("*")
      .eq("id", incident_id)
      .single();

    if (fetchErr || !incident) {
      return new Response(
        JSON.stringify({ error: "Incident not found", details: fetchErr }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let summary = "";

    // If Anthropic API Key is available, call Claude Sonnet
    if (anthropicApiKey) {
      try {
        const prompt = `You are an AI Incident Responder & Post-Mortem Auditor for KPRIET Campus Emergency Network ("Pulse").
Analyze this resolved campus incident and produce a concise 2-sentence executive summary highlighting:
1. Incident type, location, and nature of the emergency.
2. Response time and volunteer resolution outcome.

Incident Details:
- Type: ${incident.type}
- Location: ${incident.location_label} (Coords: ${incident.lat}, ${incident.lng})
- Description: ${incident.description || 'None provided'}
- Blood Group Requested: ${incident.blood_group_needed || 'N/A'}
- Reported At: ${incident.created_at}
- Accepted At: ${incident.accepted_at || 'N/A'}
- Resolved At: ${incident.resolved_at || 'N/A'}
- Assigned Responder: ${incident.volunteer_name || 'Designated Volunteer'} (${incident.volunteer_department || 'Safety Team'})

Keep it professional, concise, and under 100 words.`;

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": anthropicApiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-latest",
            max_tokens: 300,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (response.ok) {
          const aiData = await response.json();
          summary = aiData.content?.[0]?.text?.trim() || "";
        }
      } catch (aiErr) {
        console.warn("Anthropic API call failed, falling back to heuristic summary:", aiErr);
      }
    }

    // Fallback template summary if Anthropic key is missing or call failed
    if (!summary) {
      const respSeconds = incident.accepted_at && incident.created_at
        ? Math.round((new Date(incident.accepted_at).getTime() - new Date(incident.created_at).getTime()) / 1000)
        : null;
      
      const timeStr = respSeconds ? `${respSeconds} seconds` : "rapid triage";
      const volInfo = incident.volunteer_name ? `First responder ${incident.volunteer_name}` : "Campus volunteer network";

      summary = `[Automated Post-Action Report] ${incident.type.toUpperCase()} emergency reported at ${incident.location_label}. ${volInfo} responded within ${timeStr} and successfully mitigated the situation. Resolution logged and confirmed.`;
    }

    // Update incident with AI summary
    const { error: updateErr } = await supabase
      .from("incidents")
      .update({ ai_summary: summary })
      .eq("id", incident_id);

    if (updateErr) {
      console.error("Failed to update incident with ai_summary:", updateErr);
    }

    return new Response(
      JSON.stringify({ success: true, ai_summary: summary }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
