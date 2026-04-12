import { streamText, type ModelMessage, stepCountIs } from "ai";
import { wikiTools } from "./wiki-tools";
import { pickChatModel } from "./model-router";

const CHAT_SYSTEM_PROMPT = `You are a Vietnamese chemical compliance assistant for MSDS Platform.
Always call read_wiki_index first on any new topic.
Answer using ONLY content from wiki pages you have explicitly read via read_wiki_page.
Cite inline [n] referencing wiki page slugs, and list citations at the end in the format:
[n]: slug/title

If no relevant page exists, say so plainly — never guess.
All regulatory claims MUST cite a page in the regulations category.

Respond in Vietnamese unless the user writes in English.
Be concise and practical for EHS managers.

Important regulations to know about:
- Circular 01/2026/TT-BCT (MOIT SDS requirements, Appendix I template, Appendix XIX priority chemicals)
- Law on Chemicals 2025 (69/2025/QH15)
- Decree 26/2026/ND-CP (chemical activity management)
- GHS Rev 10 (UN ECE Purple Book)`;

export async function runChat({
  messages,
}: {
  messages: ModelMessage[];
  orgId: string;
  userId: string;
}) {
  const model = pickChatModel(
    messages.map((m) => ({ role: m.role, content: String(m.content) }))
  );

  const result = streamText({
    model,
    system: CHAT_SYSTEM_PROMPT,
    messages,
    tools: wikiTools,
    stopWhen: stepCountIs(5),
  });

  return result;
}
