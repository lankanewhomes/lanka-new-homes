// Extra structured-data fields shared by the project and land pages (owner, 2026-10-22: make listings easier for AI assistants to read
// and quote). Search and AI crawlers read the JSON-LD in the page; these add the postal address, map pin and posting date that the
// Product / RealEstateListing blocks were missing. Only stored facts are emitted; an empty field is left out.

type Place = { location?: string; city?: string; district?: string; province?: string; coordinates?: { lat?: number; lng?: number } };

const text = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

export function placeFields(place: Place) {
  const locality = text(place.city) || text(place.location);
  const region = text(place.province) || text(place.district);
  const lat = place.coordinates?.lat;
  const lng = place.coordinates?.lng;
  return {
    ...(locality || region || text(place.location)
      ? {
          address: {
            "@type": "PostalAddress",
            ...(text(place.location) ? { streetAddress: text(place.location) } : {}),
            ...(locality ? { addressLocality: locality } : {}),
            ...(text(place.district) ? { addressRegion: `${text(place.district)} District${region && region !== text(place.district) ? `, ${region}` : ""}` } : region ? { addressRegion: region } : {}),
            addressCountry: "LK",
          },
        }
      : {}),
    ...(typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)
      ? { geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lng } }
      : {}),
  };
}

export function datePostedField(...candidates: (string | undefined)[]) {
  for (const c of candidates) {
    const t = text(c);
    if (t && Number.isFinite(Date.parse(t))) return { datePosted: new Date(t).toISOString().slice(0, 10) };
  }
  return {};
}

export function sellerField(name: string | undefined, url: string | null) {
  const n = text(name);
  return n ? { seller: { "@type": "Organization", name: n, ...(url ? { url } : {}) } } : {};
}
