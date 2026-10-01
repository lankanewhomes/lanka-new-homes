// A short written explainer under a listing/directory page. Pages that are mostly cards have very little text for
// search engines and AI assistants to read (SEO audit 2026-10-01: 23 pages under ~200 words) — this adds plain,
// factual context in the site's contained-box style. Content must be general and true; never prices or estimates.
export function SeoAboutBlock({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  if (paragraphs.length === 0) return null;
  return (
    <section className="developer-about-box" aria-label={title}>
      <h2>{title}</h2>
      {paragraphs.map((text) => (
        <p key={text.slice(0, 40)}>{text}</p>
      ))}
    </section>
  );
}
