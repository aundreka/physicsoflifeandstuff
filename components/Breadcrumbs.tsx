// components/Breadcrumbs.tsx
import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) return null;
  return (
    <nav className="breadcrumbNav" aria-label="Breadcrumb">
      <ol className="breadcrumbList">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="breadcrumbItem">
              {item.href && !isLast ? (
                <Link href={item.href} className="breadcrumbLink">
                  {item.label}
                </Link>
              ) : (
                <span className="breadcrumbCurrent" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
