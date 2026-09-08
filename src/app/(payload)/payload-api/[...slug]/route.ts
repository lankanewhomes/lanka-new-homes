import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'
import config from '../../../../../payload.config'

// /payload-api/import-listing fetches a developer's page, its brochure and
// up to 20 images before answering — well past the 10 s default. 60 s is
// the ceiling on Vercel's Hobby plan.
export const maxDuration = 60

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
