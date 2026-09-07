// Payload's default Save/Publish controls live in a bar that's sticky to the
// *top* of the document view — easy to lose track of on these very long
// project forms. This just repositions that same bar (via CSS only, no
// behavior change) into a floating bar fixed to the bottom of the screen.
export function FloatingSaveBar() {
  return (
    <style>{`
      .doc-controls__controls-wrapper {
        position: fixed !important;
        top: auto !important;
        bottom: 20px;
        right: 20px;
        z-index: 100;
        background: var(--theme-elevation-0);
        border: 1px solid var(--theme-elevation-150);
        border-radius: 8px;
        padding: 8px 10px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
      }
      @media (max-width: 768px) {
        .doc-controls__controls-wrapper {
          left: 12px;
          right: 12px;
          bottom: 12px;
          justify-content: center;
        }
      }
    `}</style>
  );
}
