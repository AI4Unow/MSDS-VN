"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  FileText,
  Flask,
  ChatCircle,
  BookOpen,
  Gear,
  X,
  Flame,
} from "@phosphor-icons/react/dist/ssr";

const navItems = [
  { href: "/dashboard", label: "Dashboard", labelVi: "Tổng quan", icon: House },
  { href: "/sds", label: "SDS Documents", labelVi: "Tài liệu SDS", icon: FileText },
  { href: "/chemicals", label: "Chemicals", labelVi: "Hóa chất", icon: Flask },
  { href: "/chat", label: "Compliance Chat", labelVi: "Tư vấn tuân thủ", icon: ChatCircle },
  { href: "/wiki", label: "Regulatory Wiki", labelVi: "Wiki quy định", icon: BookOpen },
  { href: "/settings", label: "Settings", labelVi: "Cài đặt", icon: Gear },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-label="Đóng menu"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground
          transform transition-transform duration-200 ease-out
          md:translate-x-0 md:static md:z-auto
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Flame size={24} weight="fill" className="text-sidebar-active" />
            <span className="font-semibold text-sm tracking-tight">
              MSDS Platform
            </span>
          </Link>
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded hover:bg-white/10"
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors
                  ${
                    isActive
                      ? "bg-white/10 text-sidebar-active font-medium"
                      : "text-sidebar-foreground hover:bg-white/5 hover:text-white"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={20} weight={isActive ? "fill" : "regular"} />
                <span>{item.labelVi}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
