// Replaces Payload's own icon (shown wherever the admin needs a small mark) with the LankaNewHomes favicon.
export function AdminIcon() {
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src="/brand/lankanewhomes-favicon.png" alt="LankaNewHomes" width={28} height={28} style={{ display: 'block', width: 28, height: 28, borderRadius: 0 }} />
}
