// @ts-expect-error - Deno standard library import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ARKESEL_API_KEY = "c295dW13QlBoU29QbURxZ0R4dGk";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { to, message } = await req.json();

    if (!to || !message) {
      return new Response(JSON.stringify({ error: "Missing to or message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format phone number (Arkesel usually expects 233...)
    let formattedTo = to.replace(/\s+/g, "");
    if (formattedTo.startsWith("0")) {
      formattedTo = "233" + formattedTo.substring(1);
    } else if (!formattedTo.startsWith("233") && formattedTo.length === 9) {
      formattedTo = "233" + formattedTo;
    }

    console.log(`Sending SMS to ${formattedTo}: ${message}`);

    const url = `https://sms.arkesel.com/sms/api?action=send-sms&api_key=${ARKESEL_API_KEY}&to=${formattedTo}&from=NOVA_EYE&sms=${encodeURIComponent(message)}`;

    const response = await fetch(url);
    const result = await response.text();

    console.log("Arkesel response:", result);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("SMS Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
