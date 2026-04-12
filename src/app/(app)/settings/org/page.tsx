import { requireOrg } from "@/lib/auth/require-org";
import { db } from "@/lib/db/client";
import { organizations } from "@/lib/db/schema/organizations";
import { eq } from "drizzle-orm";
import { CardAccessForm } from "./card-access-form";
import { UpdateOrgNameForm } from "./update-org-name-form";

export default async function OrgSettingsPage() {
  const { orgId } = await requireOrg();

  const org = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org[0]) throw new Error("Organization not found");

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-xl font-bold">Cài đặt tổ chức</h1>

      {/* Org name */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Tên tổ chức
        </h2>
        <UpdateOrgNameForm currentName={org[0].name} />
      </section>

      {/* Logo */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Logo tổ chức
        </h2>
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Tải logo lên sẽ khả dụng trong phiên bản tiếp theo.
          </p>
        </div>
      </section>

      {/* Card access mode */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Chế độ truy cập phiếu an toàn
        </h2>
        <CardAccessForm currentMode={org[0].cardAccessMode} />
      </section>

      {/* Plan info */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Gói dịch vụ
        </h2>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm">
            Gói hiện tại:{" "}
            <span className="font-medium capitalize">{org[0].plan}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Nâng cấp sẽ khả dụng sau khi ra mắt.
          </p>
        </div>
      </section>
    </div>
  );
}
