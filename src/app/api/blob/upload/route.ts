import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

const MAX_PDF_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(request: Request) {
  const orgId = "dev-org";

  // Validate Content-Length header before processing
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > MAX_PDF_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_PDF_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }
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
          maximumSizeInBytes: MAX_PDF_SIZE,
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
