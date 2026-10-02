import { forwardRef, type HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { children, className, ...rest },
  ref
) {
  return (
    <div ref={ref} className={`glass-card ${className ?? ""}`} {...rest}>
      {children}
    </div>
  );
});