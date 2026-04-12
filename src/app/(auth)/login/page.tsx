// import { signIn } from "@/lib/auth/auth-config";
import { Be_Vietnam_Pro } from "next/font/google";
import { Flame } from "@phosphor-icons/react/dist/ssr";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
});

export default function LoginPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground">
            <Flame size={28} weight="fill" />
          </div>
          <h1 className={`text-2xl font-bold tracking-tight ${beVietnam.className}`}>
            MSDS Platform
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý SDS & phiếu an toàn hóa chất
          </p>
        </div>

        {/* Auth buttons */}
        <div className="space-y-3">
          {/* Google OAuth */}
          <form
            action={async () => {
              "use server";
              // Disable login
              // await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors focus-visible:outline-2 focus-visible:outline-ring"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Đăng nhập bằng Google
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">
                hoặc
              </span>
            </div>
          </div>

          {/* Magic link (Resend) */}
          <form
            action={async (formData) => {
              "use server";
              const _email = formData.get("email") as string;
              // Disable login
              // await signIn("resend", { email, redirectTo: "/dashboard" });
            }}
            className="space-y-3"
          >
            <label htmlFor="email" className="sr-only">
              Địa chỉ email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="email@congty.com"
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-primary-foreground hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-ring"
            >
              Gửi link đăng nhập
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Bằng việc đăng nhập, bạn đồng ý với Điều khoản sử dụng.
        </p>
      </div>
    </div>
  );
}
