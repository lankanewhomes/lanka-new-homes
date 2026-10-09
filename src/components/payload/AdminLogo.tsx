// Replaces the Payload logo on the login / forgot-password / reset pages with the real LankaNewHomes wordmark.
export function AdminLogo() {
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src="/logo-wordmark.svg" alt="LankaNewHomes" style={{ display: 'block', width: 190, height: 'auto', margin: '0 auto' }} />
}
