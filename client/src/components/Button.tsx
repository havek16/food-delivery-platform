import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "aura" | "ghost-glass";

const base = "disabled:cursor-not-allowed disabled:opacity-50";
const sizes = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

export function buttonClass(variant: Variant = "aura", size: keyof typeof sizes = "md"): string {
  const v = variant === "aura" ? "btn-aura" : "btn-ghost-glass";
  return `${base} ${sizes[size]} ${v}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: keyof typeof sizes;
  children: ReactNode;
}

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: keyof typeof sizes;
  href: string;
  children: ReactNode;
}

export function Button({ variant = "aura", size = "md", className, children, ...rest }: ButtonProps) {
  return (
    <button className={`${buttonClass(variant, size)} ${className ?? ""}`} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({ variant = "aura", size = "md", className, href, children, ...rest }: ButtonLinkProps) {
  return (
    <Link href={href} className={`${buttonClass(variant, size)} ${className ?? ""}`} {...rest}>
      {children}
    </Link>
  );
}