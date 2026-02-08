// @ts-ignore - Deno module resolution, not compatible with TypeScript compiler
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  deckTitle: string;
  inviterName: string;
  accessLevel: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as InvitationRequest;
    const { email, deckTitle, inviterName, accessLevel } = body;
    
    // Validate input
    if (!email || !deckTitle || !inviterName || !accessLevel) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: email, deckTitle, inviterName, accessLevel",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    // Generate email HTML
    const emailHtml = generateInvitationEmail(inviterName, deckTitle, accessLevel);
    
    console.log("Sending deck invitation email:", {
      to: email,
      subject: `${inviterName} shared a study deck with you - "${deckTitle}"`,
      inviterName,
      deckTitle,
      accessLevel,
    });

    // Integration point for email services
    // Uncomment and configure one of the options below:
    
    // Option 1: SendGrid
    /*
    import SendGridMail from "https://cdn.skypack.dev/@sendgrid/mail@7.7.0?dts";
    const sgMail = SendGridMail(Deno.env.get("SENDGRID_API_KEY"));
    await sgMail.send({
      to: email,
      from: "noreply@easierstudying.com",
      subject: `${inviterName} shared "${deckTitle}" with you`,
      html: emailHtml,
    });
    */

    // Option 2: Resend
    /*
    import { Resend } from "https://cdn.skypack.dev/resend@0.15.0?dts";
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    await resend.emails.send({
      from: "invitations@easierstudying.com",
      to: email,
      subject: `${inviterName} shared "${deckTitle}" with you`,
      html: emailHtml,
    });
    */

    // Option 3: Custom API endpoint
    /*
    const emailResponse = await fetch("https://your-email-service.com/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: `${inviterName} shared "${deckTitle}" with you`,
        html: emailHtml,
      }),
    });
    
    if (!emailResponse.ok) {
      throw new Error("Email service failed");
    }
    */

    // For now, return success (email would be sent with proper integration)
    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation email prepared successfully",
        preview: {
          to: email,
          subject: `${inviterName} shared "${deckTitle}" with you`,
          htmlPreview: emailHtml.substring(0, 200) + "...",
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending invitation:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function generateInvitationEmail(
  inviterName: string,
  deckTitle: string,
  accessLevel: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
          .content { margin: 20px 0; }
          .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>You've been invited to a study deck! 🎓</h2>
          </div>
          
          <div class="content">
            <p>Hi there!</p>
            
            <p><strong>${inviterName}</strong> has shared the study deck <strong>"${deckTitle}"</strong> with you on EasierStudying!</p>
            
            <p>With <strong>${accessLevel}</strong> access, you can:</p>
            <ul>
              <li>Study the flashcards</li>
              ${accessLevel !== "view" ? "<li>Edit and improve the cards</li>" : ""}
              ${accessLevel === "admin" ? "<li>Manage who has access to the deck</li>" : ""}
            </ul>
            
            <p>
              <a href="https://easierstudying.com/accept-invitation" class="button">Open Your Invitation</a>
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from EasierStudying. If you didn't expect this, you can safely ignore it.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
