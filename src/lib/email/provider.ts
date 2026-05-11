import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "dummy-key");

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log("Email disabled (No RESEND_API_KEY):", params.subject, "to", params.to);
    return { success: true, messageId: "dummy" };
  }

  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Vertrex OS <os@vertrex.co>",
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}
