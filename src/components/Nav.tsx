"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  Receipt,
  ScrollText,
  Users,
  Wallet,
  Landmark,
} from "lucide-react";
import type { Role } from "@/lib/roles";
import { hasPermission, type Permission } from "@/lib/roles";

type Item = {
  href: string;
  label: string;
  icon: typeof Users;
  permission?: Permission;
  student?: boolean;
};

const STAFF: Item[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users, permission: "students:read" },
  { href: "/fees", label: "Fee catalogue", icon: BookOpen, permission: "fees:read" },
  { href: "/invoices", label: "Invoices", icon: FileText, permission: "invoices:read" },
  { href: "/payments", label: "Payments", icon: Wallet, permission: "invoices:read" },
  { href: "/ledger", label: "Ledger", icon: Landmark, permission: "ledger:read" },
  { href: "/audit", label: "Audit log", icon: ScrollText, permission: "audit:read" },
];

const PORTAL: Item[] = [
  { href: "/portal", label: "Home", icon: LayoutDashboard, student: true },
  { href: "/portal/invoices", label: "Fees & invoices", icon: FileText, student: true },
  { href: "/portal/records", label: "Academic records", icon: BookOpen, student: true },
  { href: "/portal/profile", label: "Profile", icon: Users, student: true },
];

export function SideNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = role === "STUDENT" ? PORTAL : STAFF.filter(
    (i) => !i.permission || hasPermission(role, i.permission)
  );

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          item.href === "/dashboard" || item.href === "/portal"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
              active
                ? "bg-forest-900 text-paper-50 dark:bg-gold-400 dark:text-forest-950"
                : "text-forest-800 hover:bg-forest-100 dark:text-paper-200 dark:hover:bg-forest-800"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ReceiptIcon() {
  return <Receipt className="h-4 w-4" />;
}
