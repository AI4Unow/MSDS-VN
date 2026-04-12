"use client";

import { useTheme } from "next-themes";
import { List, Sun, Moon, SignOut } from "@phosphor-icons/react/dist/ssr";
import { signOut } from "next-auth/react";

export function TopNav({
  user,
  onMenuToggle,
}: {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onMenuToggle: () => void;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border bg-background/95 backdrop-blur-sm">
      {/* Left: Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 -ml-2 rounded-md hover:bg-muted"
        aria-label="Mở menu"
      >
        <List size={20} />
      </button>

      {/* Spacer */}
      <div className="hidden md:block" />

      {/* Right: Theme toggle + User menu */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          aria-label="Chuyển giao diện sáng/tối"
        >
          <Sun size={18} className="hidden dark:block" />
          <Moon size={18} className="block dark:hidden" />
        </button>

        {/* User info + Sign out */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium leading-tight truncate max-w-[160px]">
              {user.name ?? user.email?.split("@")[0]}
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[160px]">
              {user.email}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            aria-label="Đăng xuất"
          >
            <SignOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
