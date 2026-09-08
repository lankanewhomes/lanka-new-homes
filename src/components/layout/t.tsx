"use client";

import { useListingT } from "@/lib/i18n/use-listing-t";

// For server components that need one translated word (a section heading):
// <T>Similar listings</T>. Client components should call useListingT().
export function T({ children }: { children: string }) {
  const { t } = useListingT();
  return <>{t(children)}</>;
}
