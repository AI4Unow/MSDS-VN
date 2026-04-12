import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/lib/auth/auth-config";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = (session.user as { orgId?: string | null }).orgId;
  if (!orgId) {
    return NextResponse.json({ error: "No organization" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(`${orgId}/sds/`)) {
          throw new Error("Invalid upload path");
        }
        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: 25 * 1024 * 1024,
          metadata: { orgId },
        };
      },
      onUploadCompleted: async () => {
        // Finalize happens client-side via finalizeSdsUpload
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
