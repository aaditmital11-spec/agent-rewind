import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

// Thin wrappers so every table has the same borders, padding, and header style.

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-line bg-surface">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ className = "", ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`h-8 border-b border-line px-3 text-left text-xs font-medium whitespace-nowrap text-muted ${className}`}
      {...props}
    />
  );
}

export function Td({ className = "", ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`h-9 px-3 ${className}`} {...props} />;
}
