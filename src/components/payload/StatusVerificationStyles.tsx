// Gives the Projects "Status & Badges" tab's Hot Deal Banner collapsible
// its own background so it stands out from the plain fields around it.
export function StatusVerificationStyles() {
  return (
    <style>{`
      .status-verification-collapsible {
        background: var(--theme-elevation-50);
        border-radius: 6px;
        padding: 4px 12px;
      }
    `}</style>
  );
}
