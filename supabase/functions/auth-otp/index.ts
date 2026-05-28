// @ts-expect-error - Deno standard library import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error - Supabase client import for Deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ARKESEL_API_KEY = "c295dW13QlBoU29QbURxZ0R4dGk";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      // @ts-expect-error - Deno environment variable access
      Deno.env.get("SUPABASE_URL")!,
      // @ts-expect-error - Deno environment variable access
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, phone, code, type, email, new_password } = await req.json();

    let userEmail = email;
    let userPhone = phone;

    // 1. Resolve missing email/phone from profiles table if needed
    if (userPhone && !userEmail) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("phone", userPhone)
        .maybeSingle();
      if (profile) {
        userEmail = profile.email;
      }
    } else if (userEmail && !userPhone) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("email", userEmail)
        .maybeSingle();
      if (profile) {
        userPhone = profile.phone;
      }
    }

    if (action === "send") {
      if (!userPhone && userEmail) {
        return new Response(JSON.stringify({ error: "No account found for this email address" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!userPhone) {
        return new Response(JSON.stringify({ error: "Phone number is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

      // Store in DB
      const { error: dbError } = await supabase
        .from("verification_codes")
        .insert({
          phone: userPhone,
          code: otp,
          type: type || 'signup',
          expires_at: expiresAt
        });

      if (dbError) throw dbError;

      // Clean and format phone number (e.g. "024 400 0000" -> "233244000000")
      let formattedTo = userPhone.replace(/\D/g, "");
      if (formattedTo.startsWith("0") && formattedTo.length === 10) {
        formattedTo = "233" + formattedTo.substring(1);
      }
      if (formattedTo.length === 9 && !formattedTo.startsWith("0")) {
        formattedTo = "233" + formattedTo;
      }

      // 1. Send via SMS (Arkesel)
      let message = "";
      if (type === 'reset') {
        message = `Your NOVA Eye Care password reset code is: ${otp}. Valid for 10 minutes.`;
      } else {
        message = `Welcome to NOVA Eye Care! Your verification code is: ${otp}.`;
      }

      const ARKESEL_API_KEY = Deno.env.get("ARKESEL_API_KEY") || "V2dRRkN0TENUZWZnZEpFeGtpRUo";
      let sentSMS = false;
      let smsErrorMsg = "";

      if (ARKESEL_API_KEY) {
        try {
          const url = `https://sms.arkesel.com/sms/api?action=send-sms&api_key=${ARKESEL_API_KEY}&to=${formattedTo}&from=NOVA_EYE&sms=${encodeURIComponent(message)}`;
          const smsResp = await fetch(url);
          if (smsResp.ok) {
            sentSMS = true;
          } else {
            smsErrorMsg = `Status: ${smsResp.status}`;
          }
        } catch (err: any) {
          smsErrorMsg = err.message || String(err);
          console.error("SMS sending error:", err);
        }
      } else {
        console.warn("ARKESEL_API_KEY is not configured. SMS not sent.");
      }

      // 2. Send via Email (Resend)
      let sentEmail = false;
      let emailErrorMsg = "";

      if (userEmail) {
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "re_PMEt77cb_CrGUFqqLP2PohrEBdLwx4Wfs";
        if (RESEND_API_KEY) {
          try {
            const subject = type === 'reset'
              ? 'Your NOVA Eye Care Password Reset Code'
              : 'Your NOVA Eye Care OTP Verification Code';

            const emailHtml = `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
                <h2 style="color: #0070f3; text-align: center;">Nova Eye Care Portal</h2>
                <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
                <p>Hello,</p>
                <p>You requested a One-Time Password (OTP) verification code for your Nova Eye Care account.</p>
                <p>Please use the verification code below:</p>
                <div style="background-color: #f0f7ff; border: 1px dashed #0070f3; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #0070f3; margin: 20px 0; border-radius: 4px;">
                  ${otp}
                </div>
                <p style="font-size: 13px; color: #666;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
              </div>
            `;

            const r = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: Deno.env.get("EMAIL_FROM") || "NOVA Eye Care <onboarding@resend.dev>",
                to: [userEmail],
                subject,
                html: emailHtml,
              }),
            });

            if (r.ok) {
              sentEmail = true;
            } else {
              const errBody = await r.text();
              emailErrorMsg = `Status: ${r.status}, Body: ${errBody}`;
              console.error("Resend API error:", emailErrorMsg);
            }
          } catch (err: any) {
            emailErrorMsg = err.message || String(err);
            console.error("Email sending error:", err);
          }
        } else {
          console.warn("RESEND_API_KEY is not configured. Email not sent.");
        }
      }

      const isProduction = Deno.env.get("NODE_ENV") === "production";
      if (isProduction && !sentEmail && !sentSMS) {
        return new Response(JSON.stringify({ error: `Failed to deliver verification code. SMS error: ${smsErrorMsg || "none"}, Email error: ${emailErrorMsg || "none"}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        sentViaSMS: sentSMS, 
        sentViaEmail: sentEmail,
        // Provide devOtp in development mode for easier debugging/testing
        devOtp: !isProduction ? otp : undefined
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      if (!userPhone || !code) throw new Error("Phone/email and code required");

      const { data, error } = await supabase
        .from("verification_codes")
        .select("*")
        .eq("phone", userPhone)
        .eq("code", code)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark as used
      await supabase
        .from("verification_codes")
        .update({ used: true })
        .eq("id", data[0].id);

      // If it's a signup, mark profile as verified
      if (userEmail) {
        const { data: userProfile } = await supabase.from("profiles").select("id").eq("email", userEmail).single();
        if (userProfile) {
          await supabase.from("profiles").update({ is_active: true }).eq("id", userProfile.id);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset-password") {
      if (!userPhone || !code || !new_password) throw new Error("Phone/email, code, and new password required");

      const { data, error } = await supabase
        .from("verification_codes")
        .select("*")
        .eq("phone", userPhone)
        .eq("code", code)
        .eq("used", false)
        .eq("type", "reset")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return new Response(JSON.stringify({ error: "Invalid or expired reset code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark code as used
      await supabase.from("verification_codes").update({ used: true }).eq("id", data[0].id);

      // Find user by phone (stored in profile)
      const { data: profile } = await supabase.from("profiles").select("id").eq("phone", userPhone).single();
      if (!profile) throw new Error("Account not found for this phone number/email");

      // Update password using admin API
      const { error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
        password: new_password
      });

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (action === "welcome") {
       if (!userPhone) throw new Error("Phone required");
       const welcomeMsg = `Account created successfully! Welcome to NOVA Eye Care. We look forward to seeing you soon. Book your first appointment at https://novaeyecareservice.com/book`;
       
       let formattedTo = userPhone.replace(/\D/g, "");
       if (formattedTo.startsWith("0") && formattedTo.length === 10) {
         formattedTo = "233" + formattedTo.substring(1);
       }
       if (formattedTo.length === 9 && !formattedTo.startsWith("0")) {
         formattedTo = "233" + formattedTo;
       }
       
       const ARKESEL_API_KEY = Deno.env.get("ARKESEL_API_KEY") || "V2dRRkN0TENUZWZnZEpFeGtpRUo";
       const url = `https://sms.arkesel.com/sms/api?action=send-sms&api_key=${ARKESEL_API_KEY}&to=${formattedTo}&from=NOVA_EYE&sms=${encodeURIComponent(welcomeMsg)}`;
       await fetch(url);
       
       return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Auth OTP Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
