import { requireOrg } from "@/lib/auth/require-org";
import { runChat } from "@/lib/chat/chat-agent";
import { convertToModelMessages, type UIMessage } from "ai";
import { rateLimit } from "@/lib/rate-limit";

const MAX_MESSAGES = 50;
const MAX_CONTENT_LENGTH = 10_000;

export async function POST(req: Request) {
  const { orgId, userId } = await requireOrg();
  
  // Rate limit: 10 requests per minute per user
  const rateLimitResult = rateLimit(`chat:${userId}`, 10, 60_000);
  if (!rateLimitResult.success) {
    return Response.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }
  
  const body = await req.json();
  const messages: UIMessage[] = body.messages ?? [];

  // Input validation
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "No messages provided" }, { status: 400 });
  }

  if (messages.length > MAX_MESSAGES) {
    return Response.json(
      { error: `Max ${MAX_MESSAGES} messages per request` },
      { status: 400 }
    );
  }

  // Validate last user message content length
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const lastContent = lastUserMsg?.parts
    ?.filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");
  if (lastContent && lastContent.length > MAX_CONTENT_LENGTH) {
    return Response.json(
      { error: `Message too long (max ${MAX_CONTENT_LENGTH} chars)` },
      { status: 400 }
    );
  }

  // Convert UI messages to model messages
  const modelMessages = await convertToModelMessages(messages);

  const result = await runChat({ messages: modelMessages, orgId, userId });
  return result.toUIMessageStreamResponse();
}
