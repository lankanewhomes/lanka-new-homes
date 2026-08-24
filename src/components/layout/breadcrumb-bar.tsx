"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function toTitleCase(segment: string): string {
  return decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function BreadcrumbBar() {
  const pathname = usePathname();

  if (!pathname || pathname === "/") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="site-breadcrumb" aria-label="Breadcrumb">
      <div className="site-breadcrumb-inner">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>

          {segments.map((segment, index) => {
            const href = `/${segments.slice(0, index + 1).join("/")}`;
            const isLast = index === segments.length - 1;

            return (
              <li key={href}>
                <span className="site-breadcrumb-separator" aria-hidden="true">
                  /
                </span>
                {isLast ? (
                  <span aria-current="page">{toTitleCase(segment)}</span>
                ) : (
                  <Link href={href}>{toTitleCase(segment)}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
