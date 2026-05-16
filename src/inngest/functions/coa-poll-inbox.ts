/* eslint-disable @typescript-eslint/no-explicit-any */
import { inngest } from "@/inngest/client";
import { put } from "@vercel/blob";
import { db } from "@/lib/db/client";
import { asCoas } from "@/lib/db/schema/asia-shine";
import { classifyDocument } from "@/lib/coa/document-classifier";

async function fetchUnseenEmails() {
  const results: {
    messageId: string;
    attachments: Array<{ filename: string; content: Buffer }>;
  }[] = [];

  try {
    const Imap = (await import("imapflow")).ImapFlow;
    const { simpleParser } = await import("mailparser");

    const client = new Imap({
      host: process.env.COA_EMAIL_HOST!,
      port: 993,
      secure: true,
      auth: {
        user: process.env.COA_EMAIL_USER!,
        pass: process.env.COA_EMAIL_PASSWORD!,
      },
      tlsOptions: { rejectUnauthorized: true },
    } as any);

    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      for await (const message of client.fetch({ seen: false }, { source: true })) {
        const parsed = await simpleParser(message.source);
        if (parsed.attachments?.length) {
          results.push({
            messageId: parsed.messageId ?? "",
            attachments: parsed.attachments.map((a: any) => ({
              filename: a.filename ?? "unknown",
              content: a.content,
            })),
          });
        }
        await client.messageFlagsSet({ uid: message.uid }, ["\\Seen"] as any);
      }
    } finally {
      lock.release();
      await client.logout();
    }
  } catch (error) {
    console.error("IMAP connection failed:", error);
  }

  return results;
}

export const coaPollInbox = inngest.createFunction(
  {
    id: "coa/poll-inbox",
    name: "Poll COA Inbox",
    triggers: [{ event: "coa/poll-inbox" }],
  },
  async ({ step }) => {
    const emails = await step.run("fetch-unseen-emails", async () => {
      return fetchUnseenEmails();
    });

    let processed = 0;

    for (const email of emails) {
      for (const attachment of email.attachments) {
        const content = Buffer.from(attachment.content as unknown as Uint8Array);
        const docType = classifyDocument(attachment.filename, content);
        if (docType !== "coa") continue;

        await step.run(`upload-${processed}`, async () => {
          const blob = await put(
            `coas/${Date.now()}_${attachment.filename}`,
            content,
            { access: "private", addRandomSuffix: true }
          );

          await db.insert(asCoas).values({
            documentUrl: blob.url,
            emailMessageId: email.messageId,
            receivedDate: new Date(),
            processingStatus: "queued",
          });
        });

        processed++;
      }
    }

    return { processed };
  }
);
