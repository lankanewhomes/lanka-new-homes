"use server";

import { redirect } from "next/navigation";
import { assignPackage, bookAddon, savePackageProjects, uploadCreative, type WriteResult } from "@/lib/featured/admin";
import type { AddOnType, FeaturedTier } from "@/lib/featured/config";
import { getSession } from "../../_data/session";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const back = (path: string, result: WriteResult): never => redirect(`${path}?${new URLSearchParams({ notice: result.message, ok: result.ok ? "1" : "0" })}`);

export async function assignPackageAction(form: FormData) {
  const session = await getSession();
  if (!session) redirect("/developers/login");
  back("/dashboard/featured", await assignPackage(session, { developerSlug: text(form, "developer"), tier: text(form, "tier") as FeaturedTier, startDate: text(form, "start"), endDate: text(form, "end"), foundingPartner: form.get("founding") === "on" }));
}

export async function saveProjectsAction(form: FormData) {
  const session = await getSession();
  if (!session) redirect("/developers/login");
  back("/dashboard/featured", await savePackageProjects(session, text(form, "package"), form.getAll("project").map(String)));
}

export async function bookAddonAction(form: FormData) {
  const session = await getSession();
  if (!session) redirect("/developers/login");
  const upload = form.get("image_file");
  let image = text(form, "image_url");
  if (upload instanceof File && upload.size > 0) image = (await uploadCreative(upload)) ?? image;
  back("/dashboard/featured/addons", await bookAddon(session, {
    type: text(form, "type") as AddOnType, developerSlug: text(form, "developer"), projectSlug: text(form, "project") || undefined, city: text(form, "city") || undefined,
    startDate: text(form, "start"), endDate: text(form, "end"), image, headline: text(form, "headline"), subline: text(form, "subline"), ctaLabel: text(form, "cta_label"), ctaHref: text(form, "cta_href"),
  }));
}
