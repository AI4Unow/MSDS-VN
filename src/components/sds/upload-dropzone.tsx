"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { upload } from "@vercel/blob/client";
import { finalizeSdsUpload } from "@/lib/sds/finalize-upload";
import { UploadSimple, FilePdf, Spinner } from "@phosphor-icons/react/dist/ssr";

async function computeSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function UploadDropzone({ orgId }: { orgId: string }) {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<
    { filename: string; status: string; duplicate?: boolean }[]
  >([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);
      const newResults: { filename: string; status: string; duplicate?: boolean }[] = [];

      for (const file of acceptedFiles) {
        try {
          if (file.type !== "application/pdf") {
            newResults.push({ filename: file.name, status: "Chỉ chấp nhận PDF" });
            continue;
          }
          if (file.size > 25 * 1024 * 1024) {
            newResults.push({ filename: file.name, status: "File quá lớn (max 25MB)" });
            continue;
          }

          // Compute hash for dedupe
          const hash = await computeSha256(file);

          // Upload to Vercel Blob via client-direct pattern
          const blob = await upload(
            `${orgId}/sds/${crypto.randomUUID()}/${file.name}`,
            file,
            {
              access: "public",
              handleUploadUrl: "/api/blob/upload",
              contentType: "application/pdf",
            }
          );

          // Finalize — create DB record + enqueue Inngest job
          const result = await finalizeSdsUpload({
            url: blob.url,
            pathname: blob.pathname,
            hash,
            filename: file.name,
            sizeBytes: file.size,
          });

          newResults.push({
            filename: file.name,
            status: result.duplicate ? "Đã tồn tại" : "Đã tải lên",
            duplicate: result.duplicate,
          });
        } catch (err) {
          newResults.push({
            filename: file.name,
            status: `Lỗi: ${(err as Error).message}`,
          });
        }
      }

      setResults((prev) => [...newResults, ...prev]);
      setUploading(false);
    },
    [orgId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
    disabled: uploading,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          flex flex-col items-center justify-center gap-3 p-8
          border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${isDragActive
            ? "border-primary bg-primary/5"
            : "border-primary/40 hover:border-primary/70 hover:bg-muted/50"
          }
          ${uploading ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Spinner size={32} className="animate-spin text-primary" />
        ) : (
          <UploadSimple size={32} className="text-primary" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium">
            {isDragActive ? "Thả file PDF vào đây" : "Kéo thả file PDF hoặc nhấn để chọn"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tối đa 25MB mỗi file. Chỉ chấp nhận PDF.
          </p>
        </div>
      </div>

      {/* Upload results */}
      {results.length > 0 && (
        <ul className="space-y-1">
          {results.map((r, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <FilePdf size={16} className="text-primary shrink-0" />
              <span className="truncate">{r.filename}</span>
              <span
                className={`text-xs ${
                  r.duplicate
                    ? "text-amber-600"
                    : r.status.startsWith("Lỗi")
                      ? "text-destructive"
                      : "text-green-600"
                }`}
              >
                {r.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
