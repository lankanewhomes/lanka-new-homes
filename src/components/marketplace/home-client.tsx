"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, MapPin, Pause, Search, X } from "lucide-react";
import { SiteLanguage, useLanguage } from "@/components/layout/language-provider";
import { ListingGridCard } from "@/components/marketplace/listing-page";
import { allProjectCategories } from "@/lib/listing-categories";
import type { HeroAd, Project } from "@/types";

// Real photos of each city (Wikimedia Commons), replacing generic Unsplash
// stock photos that weren't actually of these places. Kandy's original
// requested filename ("Sri Lanka -029- Kandy Temple of the Tooth.jpg")
// no longer exists on Commons — substituted a real Temple of the Tooth
// photo instead (same subject, different upload).
const neighborhoods = [
  { name: "Colombo", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/06/Colombo_City%2C_Sri_Lanka.jpg/960px-Colombo_City%2C_Sri_Lanka.jpg" },
  { name: "Kandy", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f3/SL_Kandy_asv2020-01_img34_Sacred_Tooth_Temple.jpg/960px-SL_Kandy_asv2020-01_img34_Sacred_Tooth_Temple.jpg" },
  { name: "Galle", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/Galle_Sri_Lanka.jpg/960px-Galle_Sri_Lanka.jpg" },
  { name: "Negombo", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/97/Negombo_Beach%2C_Sri_Lanka.jpg/960px-Negombo_Beach%2C_Sri_Lanka.jpg" },
  { name: "Ella", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0e/Nine_Arches_Bridge_in_Ella.jpg/960px-Nine_Arches_Bridge_in_Ella.jpg" },
  { name: "Jaffna", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Jaffna_Fort.jpg/960px-Jaffna_Fort.jpg" },
  { name: "Nuwara Eliya", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2e/Nuwara_Eliya_Gregory_Lake.jpg/960px-Nuwara_Eliya_Gregory_Lake.jpg" },
  { name: "Trincomalee", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Tricomalee_Sri_Lanka.jpg/960px-Tricomalee_Sri_Lanka.jpg" },
  { name: "Bentota", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Bentota_River_in_Dharga%2C_Sri_Lanka.jpg/960px-Bentota_River_in_Dharga%2C_Sri_Lanka.jpg" },
  { name: "Matara", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/StarfortMatara.jpg/960px-StarfortMatara.jpg" },
  { name: "Anuradhapura", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ad/Ruwanwelisaya_Stupa_Anuradhapura.jpg/960px-Ruwanwelisaya_Stupa_Anuradhapura.jpg" },
  { name: "Kurunegala", image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Kurunegala_Sri_Lanka.JPG/960px-Kurunegala_Sri_Lanka.JPG" },
];

// Popular-searches SEO footer block — realcommercial.com.au-style columns of
// "{type} for sale in {place}" links. Every href is a real, server-filtered
// page (either an existing /projects/* category page, or /projects and
// /land's `type`/`location`/`landUse` query filters) — never a page with
// invented results. Some target cities (Kandy, Wattala) have no listings
// yet; those links still land on a real filtered page with an honest empty
// state, the same way the homepage's own "Explore by city" tiles already
// treat those cities as legitimate destinations via /search.
const SEO_LINK_GROUPS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Land",
    links: [
      { label: "Land for sale in Nuwara Eliya", href: "/land?location=Nuwara+Eliya" },
      { label: "Residential land for sale", href: "/land?landUse=Residential" },
      { label: "Agricultural land for sale", href: "/land?landUse=Agricultural" },
      { label: "Beachfront land for sale in Sri Lanka", href: "/land" },
    ],
  },
  {
    title: "Houses",
    links: [
      { label: "House for sale in Kandy", href: "/projects?type=House&location=Kandy" },
      { label: "Houses for sale in Wattala", href: "/projects?type=House&location=Wattala" },
      { label: "Houses for sale in Kottawa", href: "/projects?type=House&location=Kottawa" },
      { label: "Houses for sale in Thalawathugoda", href: "/projects?type=House&location=Thalawathugoda" },
    ],
  },
  {
    title: "Apartments & condominiums",
    links: [
      { label: "Apartments for sale in Colombo", href: "/projects/colombo" },
      { label: "New luxury apartments in Sri Lanka", href: "/projects/luxury" },
      { label: "Port City Colombo apartments", href: "/projects/port-city-colombo" },
      { label: "Apartments for sale in Dehiwala", href: "/projects?type=Apartments&location=Dehiwala" },
      { label: "Serviced apartments in Sri Lanka", href: "/projects/serviced-apartments" },
    ],
  },
  {
    title: "New developments",
    links: [
      { label: "New projects in Sri Lanka", href: "/projects" },
      { label: "New villa developments in Sri Lanka", href: "/projects/villas" },
      { label: "Beachfront condo developments", href: "/projects/beachfront" },
      { label: "Branded residences in Sri Lanka", href: "/projects/branded-residences" },
      { label: "Pre-construction & off-plan projects", href: "/projects/pre-construction" },
    ],
  },
];

export function HomeClient({ projects, lands = [] }: { projects: Project[]; lands?: Project[] }) {
  const { language } = useLanguage();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);
  // Only the active slide's image is ever needed at first paint — the
  // other 3 sit in the DOM (for the sliding-track animation) but load
  // their <Image> lazily, on demand, as the carousel actually reaches
  // them, instead of all 4 competing for bandwidth with the real LCP
  // image on initial load. Tracks the furthest slide reached (not just
  // the current one) so a slide already shown stays mounted when the
  // carousel moves backward past it.
  const [maxHeroSlideReached, setMaxHeroSlideReached] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [heroAds, setHeroAds] = useState<HeroAd[]>([]);

  useEffect(() => {
    fetch("/api/hero-ads?active=1")
      .then((response) => response.json())
      .then((data) => setHeroAds(Array.isArray(data?.ads) ? data.ads : []))
      .catch(() => setHeroAds([]));
  }, []);

  // Falls back to real listings (their own hero photo, linking to their own
  // page) whenever there's no paid hero ad slide to show — previously this
  // was 4 hardcoded generic Unsplash lifestyle photos all pointing at
  // /search, none of them an actual project on the site.
  const fallbackProjectSlides = useMemo(
    () =>
      [...projects]
        .filter((project) => project.heroImage)
        .sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))
        .slice(0, 4)
        .map((project) => ({ src: project.heroImage, href: `/projects/${project.slug}`, alt: project.name })),
    [projects]
  );

  const heroSlides = useMemo(() => (
    heroAds.length > 0
      ? heroAds.map((ad) => ({ src: ad.image, href: ad.linkUrl, alt: ad.headline }))
      : fallbackProjectSlides
  ), [heroAds, fallbackProjectSlides]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeroSlide((current) => (current >= heroSlides.length ? 0 : current));
  }, [heroSlides.length]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMaxHeroSlideReached((max) => Math.max(max, heroSlide));
  }, [heroSlide]);

  useEffect(() => {
    if (heroPaused) return;
    const interval = window.setInterval(() => setHeroSlide((current) => (current + 1) % heroSlides.length), 5500);
    return () => window.clearInterval(interval);
  }, [heroPaused, heroSlides.length]);

  const showPreviousHeroSlide = () => setHeroSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length);
  const showNextHeroSlide = () => setHeroSlide((current) => (current + 1) % heroSlides.length);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchTerm.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
    setMobileSearchOpen(false);
  };

  const copy: Record<SiteLanguage, {
    shelfLaunching: string;
    heroTitle: string;
    heroSubtitle: string;
    searchPlaceholder: string;
    searchRegion: string;
    searchButton: string;
    communities: string;
    viewAll: string;
    adLabel: string;
    adTitle: string;
    adText: string;
    adCta: string;
  }> = {
    en: {
      shelfLaunching: "New communities launching soon",
      heroTitle: "New homes for sale across Sri Lanka",
      heroSubtitle: "Discover new condos, apartments, villas, and homes across Sri Lanka, with current pricing, floor plans, and availability directly from developers.",
      searchPlaceholder: "Search projects & lands",
      searchRegion: "All of Sri Lanka",
      searchButton: "Search",
      communities: "Communities",
      viewAll: "View all",
      adLabel: "Advertisement",
      adTitle: "Showcase your new development on LankaNewHomes",
      adText: "Reach active Sri Lankan buyers searching for newly launched communities.",
      adCta: "Promote your listing",
    },
    ta: {
      shelfLaunching: "விரைவில் தொடங்கும் புதிய சமூகங்கள்",
      heroTitle: "New homes for sale across Sri Lanka",
      heroSubtitle: "Discover new condos, apartments, villas, and homes across Sri Lanka, with current pricing, floor plans, and availability directly from developers.",
      searchPlaceholder: "Search projects & lands",
      searchRegion: "இலங்கை முழுவதும்",
      searchButton: "தேடல்",
      communities: "சமூகங்கள்",
      viewAll: "அனைத்தையும் காண்க",
      adLabel: "விளம்பரம்",
      adTitle: "LankaNewHomes இல் உங்கள் புதிய திட்டத்தை முன்னிறுத்துங்கள்",
      adText: "புதிய சமூகங்களை தேடும் செயலில் உள்ள இலங்கை வாங்குபவர்களை அடையுங்கள்.",
      adCta: "உங்கள் பட்டியலை விளம்பரப்படுத்து",
    },
    si: {
      shelfLaunching: "ඉක්මනින් ආරම්භ වන නව ප්‍රජාවන්",
      heroTitle: "New homes for sale across Sri Lanka",
      heroSubtitle: "Discover new condos, apartments, villas, and homes across Sri Lanka, with current pricing, floor plans, and availability directly from developers.",
      searchPlaceholder: "Search projects & lands",
      searchRegion: "ශ්‍රී ලංකාව පුරා",
      searchButton: "සොයන්න",
      communities: "ප්‍රජාවන්",
      viewAll: "සියල්ල බලන්න",
      adLabel: "ප්‍රචාරණය",
      adTitle: "LankaNewHomes තුළ ඔබගේ නව සංවර්ධනය ප්‍රදර්ශනය කරන්න",
      adText: "නව ප්‍රජාවන් සොයන ක්‍රියාශීලී ශ්‍රී ලාංකික මිලදී ගන්නන් වෙත ළඟා වන්න.",
      adCta: "ඔබගේ ලැයිස්තුගත කිරීම ප්‍රවර්ධනය කරන්න",
    },
  };

  const t = copy[language];

  // Sorted by finalScore (completeness + engagement + recency + package
  // boost — same field the site's default "Recommended" search sort
  // already uses, computeFinalScore in project-scoring.ts) before slicing
  // to 4, so a Premium project's stronger boost actually earns it a spot
  // here over a Featured one when there are more than 4 featured listings
  // — not just "featured vs not."
  const featuredProjects = useMemo(
    () => [...projects].filter((project) => project.isFeatured).sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0)).slice(0, 4),
    [projects]
  );
  // Sorted by createdAt (when the row was actually added here), not
  // launchDate (the developer's own marketed date, often unset) — sorting
  // by launchDate meant a project with no launchDate could never surface on
  // this shelf, and the same handful of projects with one set showed up
  // indefinitely regardless of what was actually added recently.
  const newListings = useMemo(() => {
    const featuredSlugs = new Set(featuredProjects.map((project) => project.slug));
    return [...projects]
      .filter((project) => !featuredSlugs.has(project.slug))
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
      .slice(0, 8);
  }, [projects, featuredProjects]);
  const landListings = useMemo(
    () => [...lands].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(0, 8),
    [lands]
  );
  const searchSuggestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];

    const suggestions = new Map<string, { label: string; detail: string; href: string }>();
    projects.forEach((project) => {
      [
        { label: project.name, detail: "Project", href: `/projects/${project.slug}` },
        { label: project.city, detail: "City", href: `/search?q=${encodeURIComponent(project.city)}` },
      ].forEach((suggestion) => {
        if (suggestion.label?.toLowerCase().includes(query) && !suggestions.has(suggestion.label)) {
          suggestions.set(suggestion.label, suggestion);
        }
      });
    });

    return Array.from(suggestions.values()).slice(0, 8);
  }, [projects, searchTerm]);
  const selectSearchSuggestion = (suggestion: { label: string; href: string }) => {
    setSearchTerm(suggestion.label);
    setDesktopSearchOpen(false);
    setMobileSearchOpen(false);
    router.push(suggestion.href);
  };
  const heroQuickLinks = [
    { path: "/developers/prime-lands", breadcrumbLabel: "Prime Lands", isHighlighted: true },
    ...allProjectCategories,
    { path: "/land", breadcrumbLabel: "Lands" },
  ];

  return <div className="livabl-home">
    <section className="luxury-hero-two" aria-label="Luxury listing search hero">
      <div className="luxury-hero-two-media">
        <div className="luxury-hero-two-track" style={{ transform: `translateX(-${heroSlide * 100}%)` }}>
          {heroSlides.map((slide, index) => <div className="luxury-hero-two-slide" key={`${slide.src}-${index}`}><Link href={slide.href} className="luxury-hero-two-slide-link" aria-hidden={index !== heroSlide} tabIndex={index === heroSlide ? 0 : -1}>{index <= maxHeroSlideReached ? <Image src={slide.src} alt={index === heroSlide ? slide.alt : ""} fill priority={index === 0} sizes="100vw" /> : null}<span className="luxury-hero-two-view-project"><ArrowUpRight className="luxury-hero-two-view-project-icon" size={16} strokeWidth={1.5} aria-hidden="true" />View project</span></Link></div>)}
        </div>
        <div className="luxury-hero-two-overlay" />
        <button type="button" className="luxury-hero-two-arrow" aria-label="Previous slide" onClick={showPreviousHeroSlide}><ChevronLeft size={18} /></button>
        <button type="button" className="luxury-hero-two-arrow luxury-hero-two-arrow-right" aria-label="Next slide" onClick={showNextHeroSlide}><ChevronRight size={18} /></button>
        <div className="luxury-hero-two-pagination" aria-label="Slide pagination">{heroSlides.map((_, index) => <button key={index} type="button" className={index === heroSlide ? "active" : undefined} aria-label={`Show slide ${index + 1}`} aria-current={index === heroSlide} onClick={() => setHeroSlide(index)} />)}</div>
        <button type="button" className="luxury-hero-two-pause" aria-label={heroPaused ? "Play slideshow" : "Pause slideshow"} onClick={() => setHeroPaused((paused) => !paused)}>{heroPaused ? <ChevronRight size={16} /> : <Pause size={16} />}</button>
      </div>
      <div className="luxury-hero-two-panel">
          <h1>{t.heroTitle}</h1>
          <p className="luxury-hero-two-subheading">{t.heroSubtitle}</p>
          <form className="hero-search luxury-hero-two-top-search" onSubmit={submitSearch}>
            <label><input aria-label="Search homes" value={searchTerm} onFocus={() => { setMobileSearchOpen(true); setDesktopSearchOpen(true); }} onChange={(event) => setSearchTerm(event.target.value)} placeholder={t.searchPlaceholder} /></label>
            <button type="button" className="hero-region-picker" aria-label="Select region"><MapPin size={17} /><span>{t.searchRegion}</span><ChevronDown size={16} /></button>
            <button type="submit" aria-label={t.searchButton} className="hero-search-submit"><Search size={19} /></button>
          </form>
          {desktopSearchOpen && searchSuggestions.length > 0 ? (
            <div className="hero-search-suggestions" role="listbox" aria-label="Search suggestions">
              {searchSuggestions.map((suggestion) => (
                <button key={`${suggestion.detail}-${suggestion.label}`} type="button" role="option" onMouseDown={(event) => event.preventDefault()} onClick={() => selectSearchSuggestion(suggestion)}>
                  <Search size={16} aria-hidden="true" /><span>{suggestion.label}</span><small>{suggestion.detail}</small>
                </button>
              ))}
            </div>
          ) : null}
          <div className="hero-quick-links" aria-label="Browse by category">
            {heroQuickLinks.map((category) => (
              <Link
                key={category.path}
                href={category.path}
                className={`listing-filter-pill hero-quick-link-pill${"isHighlighted" in category && category.isHighlighted ? " hero-quick-link-pill-highlight" : ""}`}
              >
                <span>{category.breadcrumbLabel}</span>
              </Link>
            ))}
          </div>
      </div>
    </section>

    {mobileSearchOpen ? (
      <div className="mobile-location-search" role="dialog" aria-modal="true" aria-label="Location search">
        <button type="button" className="mobile-location-search-scrim" aria-label="Close location search" onClick={() => setMobileSearchOpen(false)} />
        <div className="mobile-location-search-panel">
          <div className="mobile-location-search-header">
            <p>Location search</p>
            <button type="button" aria-label="Close location search" onClick={() => setMobileSearchOpen(false)}><X size={22} /></button>
          </div>
          <form className="mobile-location-search-form" onSubmit={submitSearch}>
            <label className="mobile-location-search-input">
              <Search size={20} aria-hidden="true" />
              <input autoFocus aria-label="Search location" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Enter a location, address, or project" />
            </label>
            {searchSuggestions.length > 0 ? (
              <div className="mobile-location-search-suggestions" role="listbox" aria-label="Search suggestions">
                {searchSuggestions.map((suggestion) => (
                  <button key={`${suggestion.detail}-${suggestion.label}`} type="button" role="option" onClick={() => selectSearchSuggestion(suggestion)}>
                    <Search size={16} aria-hidden="true" /><span>{suggestion.label}</span><small>{suggestion.detail}</small>
                  </button>
                ))}
              </div>
            ) : null}
            <button type="button" className="mobile-location-search-region"><span>All of Sri Lanka</span><ChevronDown size={18} aria-hidden="true" /></button>
            <button type="submit" className="mobile-location-search-submit"><Search size={19} aria-hidden="true" />Search</button>
          </form>
        </div>
      </div>
    ) : null}

    <main className="home-content">
      <section className="new-listings-section" aria-label="New listings">
        <div className="featured-listings-head">
          <h2>New listings</h2>
          <p className="featured-listings-subhead">The latest developments just added to Lanka New Homes.</p>
        </div>
        <div className="featured-listings-shell">
          <div className="home-card-grid featured-listings-grid">
            {newListings.map((project) => (
              <ListingGridCard key={`new-${project.slug}`} project={project} />
            ))}
          </div>
          <div className="featured-listings-footer new-listings-footer">
            <Link href="/search" className="featured-listings-button">
              View all new listings
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Free-listing pitch to developers, right after New listings — "your project could be
          here too". Owner asked for it on the homepage but not in the hero (2026-09-24). */}
      <section className="free-listing-band" aria-label="List your project for free">
        <div className="free-listing-band-copy">
          <p className="free-listing-band-eyebrow">For developers</p>
          <h2>List your project for free</h2>
          <p>Put your development in front of buyers across Sri Lanka at no cost. Upgrade only if you want more reach.</p>
        </div>
        <ul className="free-listing-band-points">
          {["Full project page", "Photos, floor plans & brochure", "Buyer enquiries straight to you"].map((point) => (
            <li key={point}>
              <span className="free-listing-band-tick" aria-hidden="true"><Check strokeWidth={3} /></span>
              {point}
            </li>
          ))}
        </ul>
        <div className="free-listing-band-actions">
          <Link href="/for-developers" className="free-listing-band-cta">
            List your project free
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
          {/* "See pricing" removed (owner, 2026-09-24): /pricing is still being
              reviewed, unlinked from the whole site for now but kept live at
              its URL — not deleted, just not reachable by clicking around. */}
        </div>
      </section>

      {landListings.length > 0 ? (
        <section className="new-listings-section" aria-label="Land for sale in Sri Lanka">
          <div className="featured-listings-head">
            <h2>Land for sale sri lanka</h2>
            <p className="featured-listings-subhead">Residential, commercial, and agricultural land parcels for sale, listed by developers and landowners.</p>
          </div>
          <div className="featured-listings-shell">
            <div className="home-card-grid featured-listings-grid">
              {landListings.map((land) => (
                <ListingGridCard key={`land-${land.slug}`} project={land} basePath="/land" />
              ))}
            </div>
            <div className="featured-listings-footer new-listings-footer">
              <Link href="/land" className="featured-listings-button">
                View all land listings
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="neighborhoods-section" aria-label="Find the city for you">
        <div className="featured-listings-head">
          <h2>Explore by city</h2>
          <p className="featured-listings-subhead">Browse new homes and developments in Sri Lanka&apos;s most popular cities and towns.</p>
        </div>
        <div className="neighborhoods-grid">
          {neighborhoods.map((neighborhood) => (
            <Link href={`/search?city=${encodeURIComponent(neighborhood.name)}`} className="neighborhood-card" key={neighborhood.name}>
              <Image src={neighborhood.image} alt={neighborhood.name} fill sizes="(max-width: 760px) 100vw, 33vw" />
              <span className="neighborhood-card-overlay" />
              <span className="neighborhood-card-title">{neighborhood.name}</span>
            </Link>
          ))}
        </div>
        <Link href="/search" className="featured-listings-button neighborhood-section-explore">
          View more cities
          <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </section>

      <section className="seo-links-section" aria-label="Popular searches">
        <div className="featured-listings-head">
          <h2>Popular searches</h2>
          <p className="featured-listings-subhead">Browse new homes, apartments, and land for sale across Sri Lanka by type and location.</p>
        </div>
        <div className="seo-links-grid">
          {SEO_LINK_GROUPS.map((group) => (
            <div className="seo-links-column" key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

    </main>
  </div>;
}
