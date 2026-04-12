import { put } from "@vercel/blob";
import { requireOrg } from "@/lib/auth/require-org";

export async function uploadToBlob(params: {
  kind: string;
  filename: string;
  data: Blob | File | ArrayBuffer;
  contentType?: string;
  access?: "public" | "private";
}) {
  const { orgId } = await requireOrg();
  const access = params.access ?? "private";
  const path = `${orgId}/${params.kind}/${crypto.randomUUID()}/${params.filename}`;

  const blob = await put(path, params.data, {
    access,
    contentType: params.contentType,
    addRandomSuffix: false,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
  };
}
