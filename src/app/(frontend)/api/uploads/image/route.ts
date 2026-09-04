import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Generic image upload used by every "photo URL" field on the site that
// should also let someone just pick a file — profile photos, developer
// logos, etc. Deliberately separate from Payload's own Media collection
// (supabase-storage-adapter.ts): this is for ad-hoc images pasted into a
// plain URL field, not content Payload manages directly.
const BUCKET = "uploads";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set(["avatars", "logos"]);

async function ensureBucketExists() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  if (!buckets?.some((bucket) => bucket.name === BUCKET)) {
    await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
  }
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const folderInput = formData?.get("folder");
  const folder = typeof folderInput === "string" && ALLOWED_FOLDERS.has(folderInput) ? folderInput : "misc";

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 5MB or smaller" }, { status: 400 });
  }

  await ensureBucketExists();

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
