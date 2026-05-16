import { Resend } from "resend";

let _resend: Resend | undefined;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export async function sendNotification(params: {
  type: "coa_flagged" | "coa_approved" | "coa_rejected";
  coaId: string;
  deviationCount?: number;
  severity?: string;
}): Promise<void> {
  const recipients = process.env.QC_NOTIFICATION_EMAILS?.split(",").filter(Boolean);
  if (!recipients?.length) {
    console.log("No QC notification emails configured, skipping notification");
    return;
  }

  const subjects: Record<string, string> = {
    coa_flagged: `[COA Alert] ${params.deviationCount} deviation(s) detected — Tier 3 review required`,
    coa_approved: `[COA] Approved: ${params.coaId}`,
    coa_rejected: `[COA] Rejected: ${params.coaId}`,
  };

  const safeCoaId = params.coaId.replace(/[^a-zA-Z0-9_-]/g, "");

  try {
    await getResend().emails.send({
      from: process.env.AUTH_EMAIL_FROM ?? "noreply@sds-platform.example",
      to: recipients,
      subject: subjects[params.type] ?? `[COA] ${params.type}: ${safeCoaId}`,
      html: `
        <h2>COA Notification</h2>
        <p><strong>Type:</strong> ${params.type}</p>
        <p><strong>COA ID:</strong> ${safeCoaId}</p>
        ${params.deviationCount ? `<p><strong>Deviations:</strong> ${params.deviationCount}</p>` : ""}
        ${params.severity ? `<p><strong>Severity:</strong> ${params.severity.replace(/[^a-zA-Z0-9 _-]/g, "")}</p>` : ""}
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/workspace/asia-shine/coas/${safeCoaId}">View COA</a></p>
      `,
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}
