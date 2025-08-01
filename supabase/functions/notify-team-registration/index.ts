import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey",
};

interface TeamRegistrationNotification {
  teamId: number;
  teamName: string;
  captainName: string;
  captainEmail: string;
  captainPhone?: string;
  leagueName: string;
  registeredAt: string;
  rosterCount: number;
}

serve(async (req: Request) => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      teamId,
      teamName,
      captainName,
      captainEmail,
      captainPhone,
      leagueName,
      registeredAt,
      rosterCount,
    }: TeamRegistrationNotification = await req.json();

    if (!teamId || !teamName || !captainName || !captainEmail || !leagueName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Initialize Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const _supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is authenticated by checking their token
    const token = authHeader.replace("Bearer ", "");

    // Initialize regular Supabase client to verify auth
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create the notification email content
    const emailSubject = `New Team Registration: ${teamName} in ${leagueName}`;
    const registrationDate = new Date(registeredAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Toronto'
    });

    const emailContent = {
      to: ["info@ofsl.ca"],
      subject: emailSubject,
      html: `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff;">
                <!-- Header -->
                <tr>
                  <td align="center" style="background-color: #B20000; padding: 30px 20px;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-family: Arial, sans-serif;">
                      New Team Registration
                    </h1>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 40px 30px; background-color: #ffffff;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <!-- Alert Message -->
                      <tr>
                        <td style="padding-bottom: 25px;">
                          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #e8f5e9; border: 1px solid #a5d6a7;">
                            <tr>
                              <td style="padding: 20px;">
                                <p style="color: #2e7d32; font-size: 16px; line-height: 24px; margin: 0; font-family: Arial, sans-serif;">
                                  <strong>🎉 A new team has registered!</strong><br>
                                  The following team has just signed up for a league.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Team Details -->
                      <tr>
                        <td style="padding-bottom: 30px;">
                          <h2 style="color: #2c3e50; font-size: 20px; margin: 0 0 20px 0; font-family: Arial, sans-serif;">
                            Team Information
                          </h2>
                          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border: 1px solid #dee2e6;">
                            <tr>
                              <td style="padding: 20px;">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                  <tr>
                                    <td style="padding: 8px 0;">
                                      <strong style="color: #5a6c7d; font-size: 14px; font-family: Arial, sans-serif;">Team Name:</strong>
                                      <span style="color: #2c3e50; font-size: 16px; font-family: Arial, sans-serif; margin-left: 10px;">${teamName}</span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="padding: 8px 0;">
                                      <strong style="color: #5a6c7d; font-size: 14px; font-family: Arial, sans-serif;">League:</strong>
                                      <span style="color: #B20000; font-size: 16px; font-weight: bold; font-family: Arial, sans-serif; margin-left: 10px;">${leagueName}</span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="padding: 8px 0;">
                                      <strong style="color: #5a6c7d; font-size: 14px; font-family: Arial, sans-serif;">Team ID:</strong>
                                      <span style="color: #2c3e50; font-size: 16px; font-family: Arial, sans-serif; margin-left: 10px;">#${teamId}</span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="padding: 8px 0;">
                                      <strong style="color: #5a6c7d; font-size: 14px; font-family: Arial, sans-serif;">Registration Date:</strong>
                                      <span style="color: #2c3e50; font-size: 16px; font-family: Arial, sans-serif; margin-left: 10px;">${registrationDate}</span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="padding: 8px 0;">
                                      <strong style="color: #5a6c7d; font-size: 14px; font-family: Arial, sans-serif;">Roster Size:</strong>
                                      <span style="color: #2c3e50; font-size: 16px; font-family: Arial, sans-serif; margin-left: 10px;">${rosterCount} player${rosterCount !== 1 ? 's' : ''}</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Captain Details -->
                      <tr>
                        <td style="padding-bottom: 30px;">
                          <h2 style="color: #2c3e50; font-size: 20px; margin: 0 0 20px 0; font-family: Arial, sans-serif;">
                            Captain Information
                          </h2>
                          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border: 1px solid #dee2e6;">
                            <tr>
                              <td style="padding: 20px;">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                  <tr>
                                    <td style="padding: 8px 0;">
                                      <strong style="color: #5a6c7d; font-size: 14px; font-family: Arial, sans-serif;">Name:</strong>
                                      <span style="color: #2c3e50; font-size: 16px; font-family: Arial, sans-serif; margin-left: 10px;">${captainName}</span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="padding: 8px 0;">
                                      <strong style="color: #5a6c7d; font-size: 14px; font-family: Arial, sans-serif;">Email:</strong>
                                      <a href="mailto:${captainEmail}" style="color: #1976d2; font-size: 16px; font-family: Arial, sans-serif; margin-left: 10px; text-decoration: none;">${captainEmail}</a>
                                    </td>
                                  </tr>
                                  ${captainPhone ? `
                                  <tr>
                                    <td style="padding: 8px 0;">
                                      <strong style="color: #5a6c7d; font-size: 14px; font-family: Arial, sans-serif;">Phone:</strong>
                                      <span style="color: #2c3e50; font-size: 16px; font-family: Arial, sans-serif; margin-left: 10px;">${captainPhone}</span>
                                    </td>
                                  </tr>
                                  ` : ''}
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Action Required -->
                      <tr>
                        <td style="padding-bottom: 30px;">
                          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fff3cd; border: 1px solid #ffeaa7;">
                            <tr>
                              <td style="padding: 20px;">
                                <h3 style="color: #856404; font-size: 16px; margin: 0 0 10px 0; font-family: Arial, sans-serif;">
                                  ⚡ Action Required
                                </h3>
                                <p style="color: #856404; font-size: 14px; line-height: 21px; margin: 0; font-family: Arial, sans-serif;">
                                  Please follow up with the captain to ensure they send the $200 deposit via e-transfer within 48 hours to secure their spot.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Admin Link -->
                      <tr>
                        <td align="center" style="padding-bottom: 30px;">
                          <a href="https://ofsl.ca/#/my-account/manage-teams" style="display: inline-block; background-color: #B20000; color: #ffffff; font-size: 16px; font-weight: bold; font-family: Arial, sans-serif; text-decoration: none; padding: 15px 30px; border-radius: 5px;">
                            View in Admin Panel
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td align="center" style="background-color: #2c3e50; padding: 20px;">
                    <p style="color: #bdc3c7; font-size: 12px; margin: 0; font-family: Arial, sans-serif;">
                      This is an automated notification from the OFSL registration system.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `,
    };

    // Send email using Resend API
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      // eslint-disable-next-line no-console
      console.error("RESEND_API_KEY not found");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "OFSL System <noreply@ofsl.ca>",
        ...emailContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      // eslint-disable-next-line no-console
      console.error("Resend API error:", errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to send notification email",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const emailResult = await emailResponse.json();
    // eslint-disable-next-line no-console
    console.log("Notification email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Team registration notification sent successfully",
        emailId: emailResult.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in notify-team-registration function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});