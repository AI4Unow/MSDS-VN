import { requireOrg } from "@/lib/auth/require-org";
import { UploadDropzone } from "@/components/sds/upload-dropzone";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export default async function SdsUploadPage() {
  const { orgId } = await requireOrg();

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/sds"
          className="p-2 rounded-md hover:bg-muted"
          aria-label="Quay lại"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Tải lên tài liệu SDS</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Tải lên file PDF Safety Data Sheet. Hệ thống sẽ tự động trích xuất dữ liệu
        và kiểm tra trùng lặp.
      </p>

      <UploadDropzone orgId={orgId} />
    </div>
  );
}
