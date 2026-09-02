import type { Adapter, GeneratedAdapter } from '@payloadcms/plugin-cloud-storage/types'
import { supabaseAdmin } from '@/lib/supabase'

const BUCKET = 'media'

// A Payload cloud-storage adapter backed directly by Supabase Storage's own
// SDK (not the S3-compatible endpoint) — reuses the same service_role
// credentials already in .env.local, so no separate S3 access key/secret
// needs to be generated in the Supabase dashboard first.
export function supabaseStorageAdapter(): Adapter {
  return () => {
    const adapter: GeneratedAdapter = {
      name: 'supabase-storage',

      async handleUpload({ file }) {
        const { error } = await supabaseAdmin.storage.from(BUCKET).upload(file.filename, file.buffer, {
          contentType: file.mimeType,
          upsert: true,
        })
        if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`)
      },

      async handleDelete({ filename }) {
        const { error } = await supabaseAdmin.storage.from(BUCKET).remove([filename])
        if (error) throw new Error(`Supabase Storage delete failed: ${error.message}`)
      },

      generateURL({ filename }) {
        const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename)
        return data.publicUrl
      },

      // Only hit for a request Payload itself can't resolve via the stored
      // `url` (generateURL above) — redirect straight to the public object.
      staticHandler(_req, { params }) {
        const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(params.filename)
        return Response.redirect(data.publicUrl, 307)
      },
    }
    return adapter
  }
}
