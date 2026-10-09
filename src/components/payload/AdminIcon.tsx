// Replaces Payload's own icon (shown wherever the admin needs a small mark) with the LankaNewHomes favicon.
export function AdminIcon() {
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src="/brand/lankanewhomes-favicon-cms.png" alt="LankaNewHomes" width={40} height={40} style={{ display: 'block', width: 40, height: 40, borderRadius: 0 }} />
}
