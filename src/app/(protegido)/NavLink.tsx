"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const ativo = pathname === href;

  return (
    <Link
      href={href}
      className={
        ativo
          ? "rounded-full bg-primaria px-3 py-1.5 text-sm font-medium text-primaria-texto"
          : "rounded-full px-3 py-1.5 text-sm font-medium text-terciaria hover:bg-terciaria/10"
      }
    >
      {children}
    </Link>
  );
}
