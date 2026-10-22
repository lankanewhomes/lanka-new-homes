"use client";

import { dailyPick } from "@/lib/daily-rotation";
import { parseNaturalSearch } from "@/lib/natural-search";
import { tileCityMatches } from "@/lib/city-match";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, MapPin, Pause, Search, X } from "lucide-react";
import { SiteLanguage, useLanguage } from "@/components/layout/language-provider";
import { ListingGridCard } from "@/components/marketplace/listing-page";
import { allProjectCategories } from "@/lib/listing-categories";
import { getPackage, planRotationWeight } from "@/lib/packages";
import { weightedTake } from "@/lib/weighted-random";
import { isInNewListingsWindow } from "@/lib/new-listings";
import type { PopularGroup } from "@/lib/popular-searches";
import type { Developer, HeroAd, Project } from "@/types";

// Real photos of each city (Wikimedia Commons), replacing generic Unsplash
// stock photos that weren't actually of these places. Kandy's original
// requested filename ("Sri Lanka -029- Kandy Temple of the Tooth.jpg")
// no longer exists on Commons — substituted a real Temple of the Tooth
// photo instead (same subject, different upload).
const neighborhoods = [
  { name: "Colombo", image: "https://media.lankanewhomes.com/neighborhoods/colombo/colombo_city-tile.webp" },
  { name: "Kandy", image: "https://media.lankanewhomes.com/neighborhoods/kandy/kandy_city-tile.webp" },
  { name: "Galle", image: "https://media.lankanewhomes.com/neighborhoods/galle/galle_city-tile.webp" },
  { name: "Negombo", image: "https://media.lankanewhomes.com/neighborhoods/negombo/negombo_city-tile.webp" },
  { name: "Ella", image: "https://media.lankanewhomes.com/neighborhoods/ella/ella_city-tile.webp" },
  { name: "Jaffna", image: "https://media.lankanewhomes.com/neighborhoods/jaffna/jaffna_city-tile.webp" },
  { name: "Nuwara Eliya", image: "https://media.lankanewhomes.com/neighborhoods/nuwara-eliya/nuwara-eliya_city-tile.webp" },
  { name: "Trincomalee", image: "https://media.lankanewhomes.com/neighborhoods/trincomalee/trincomalee_city-tile.webp" },
  { name: "Bentota", image: "https://media.lankanewhomes.com/neighborhoods/bentota/bentota_city-tile.webp" },
  { name: "Matara", image: "https://media.lankanewhomes.com/neighborhoods/matara/matara_city-tile.webp" },
  { name: "Anuradhapura", image: "https://media.lankanewhomes.com/neighborhoods/anuradhapura/anuradhapura_city-tile.webp" },
  { name: "Kurunegala", image: "https://media.lankanewhomes.com/neighborhoods/kurunegala/kurunegala_city-tile.webp" },
  { name: "Mount Lavinia", image: "https://media.lankanewhomes.com/neighborhoods/mount-lavinia/mount-lavinia_city-tile.webp" },
  { name: "Mirissa", image: "https://media.lankanewhomes.com/neighborhoods/mirissa/mirissa_city-tile.webp" },
  { name: "Hikkaduwa", image: "https://media.lankanewhomes.com/neighborhoods/hikkaduwa/hikkaduwa_city-tile.webp" },
  { name: "Unawatuna", image: "https://media.lankanewhomes.com/neighborhoods/unawatuna/unawatuna_city-tile.webp" },
  { name: "Weligama", image: "https://media.lankanewhomes.com/neighborhoods/weligama/weligama_city-tile.webp" },
  { name: "Kalutara", image: "https://media.lankanewhomes.com/neighborhoods/kalutara/kalutara_city-tile.webp" },
  { name: "Batticaloa", image: "https://media.lankanewhomes.com/neighborhoods/batticaloa/batticaloa_city-tile.webp" },
  { name: "Dambulla", image: "https://media.lankanewhomes.com/neighborhoods/dambulla/dambulla_city-tile.webp" },
  { name: "Sigiriya", image: "https://media.lankanewhomes.com/neighborhoods/sigiriya/sigiriya_city-tile.webp" },
];

// Price bands for "Search by price". The wording is what the natural-language search understands ("under 30M",
// "between 30M and 50M", "above 150M"), so each band links to /search?q=… and lands on real filtered results.
const PRICE_BANDS: { label: string; q: string; min?: number; max?: number }[] = [
  { label: "Under Rs. 30M", q: "under 30M", max: 30_000_000 },
  { label: "Rs. 30M – 50M", q: "between 30M and 50M", min: 30_000_000, max: 50_000_000 },
  { label: "Rs. 50M – 80M", q: "between 50M and 80M", min: 50_000_000, max: 80_000_000 },
  { label: "Rs. 80M – 150M", q: "between 80M and 150M", min: 80_000_000, max: 150_000_000 },
  { label: "Over Rs. 150M", q: "above 150M", min: 150_000_000 },
];

export function HomeClient({
  projects,
  floorPlanCount: floorPlanTotal,
  lands = [],
  landPlotTotal = 0,
  developers = [],
  newListingsSince,
  rotationSeed,
  popularSearches = [],
}: {
  landPlotTotal?: number;
  projects: Project[];
  /** Counted on the server — the slimmed projects above carry no floor plans. */
  floorPlanCount?: number;
  lands?: Project[];
  developers?: Developer[];
  /** ISO cutoff for the 30-day "New listings" window, computed on the server (see lib/new-listings.ts). Omitted = no time limit. */
  newListingsSince?: string;
  /** Sri Lanka calendar date, from the server (lib/daily-rotation.ts): the New listings and Land shelves reshuffle once a day. Omitted = newest first. */
  rotationSeed?: string;
  /** Popular-searches links that have at least one listing (see lib/popular-searches.ts). */
  popularSearches?: PopularGroup[];
}) {
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

  // "Explore by city": cities with the most projects first (owner, 2026-10-14). The count uses the same rule as the search the tile
  // opens (src/lib/city-match.ts: "Colombo" includes Colombo 05, Colombo 08…); cities with no projects keep their old order at the end.
  const cityTiles = useMemo(
    () => neighborhoods
      .map((tile, order) => ({ ...tile, order, count: projects.filter((project) => tileCityMatches(project, tile.name)).length }))
      .sort((a, b) => b.count - a.count || a.order - b.order),
    [projects],
  );

  // "Search by price": how many projects fall in each band (same rule the search applies), bands with none are not shown.
  const priceBands = useMemo(() => {
    const priced = projects.filter((project) => project.startingPriceLkr > 0 && !project.priceRange?.includes("per perch"));
    return PRICE_BANDS.map((band) => ({
      ...band,
      count: priced.filter((project) => (band.min === undefined || project.startingPriceLkr >= band.min) && (band.max === undefined || project.startingPriceLkr <= band.max)).length,
    })).filter((band) => band.count > 0);
  }, [projects]);

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

  // Real count of floor plans across every listed project (shown in the home stats band).
  const floorPlanCount = floorPlanTotal ?? projects.reduce((total, project) => total + (project.floorPlans?.length ?? 0), 0);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchTerm.trim();
    // "plots in Negombo" etc. go to the land page, everything else to project search.
    const wantsLand = query ? parseNaturalSearch(query).land === true : false;
    router.push(query ? `${wantsLand ? "/land" : "/search"}?q=${encodeURIComponent(query)}` : "/search");
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
      heroSubtitle: "Discover new condos, apartments, villas, homes, and land across Sri Lanka, with current pricing, floor plans, and availability directly from developers.",
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
      heroSubtitle: "Discover new condos, apartments, villas, homes, and land across Sri Lanka, with current pricing, floor plans, and availability directly from developers.",
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
      heroSubtitle: "Discover new condos, apartments, villas, homes, and land across Sri Lanka, with current pricing, floor plans, and availability directly from developers.",
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

  // Real "Featured projects" homepage section (owner, 2026-09-24 — this used
  // to just be feeding featuredSlugs below, with nothing ever rendering it).
  // Capped at 8 (owner's build note: "'Featured projects' section limited to
  // 8, picked randomly so no one hogs the spot forever"), weighted by plan
  // (planRotationWeight in packages.ts) so Developer Pro/Campaign shows up
  // far more often than plain Featured, but never guaranteed and never the
  // only one shown. A Free-tier project never shows here either way — this
  // section is paid-tier-only inventory, unlike New listings below it.
  //
  // The random reshuffle deliberately does NOT happen in the render itself
  // (unlike heroSlides' finalScore sort, which is deterministic). Home is
  // server-rendered (revalidate: 60 — see page.tsx) and this component
  // hydrates that markup; if the very first client render called
  // Math.random() too, it would very likely disagree with what the server
  // already rendered and React would flag/undo a hydration mismatch. So the
  // first render (server AND the client's initial paint) always shows the
  // same deterministic top-N by finalScore — matching, no mismatch — and
  // only a useEffect AFTER hydration commits swaps in the weighted-random
  // pick, exactly the same "start deterministic, upgrade after mount"
  // pattern this file already uses for heroAds below.
  const FEATURED_SECTION_CAP = 8;
  const featuredEligible = useMemo(
    () => [...projects].filter((project) => project.isFeatured).sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0)),
    [projects]
  );
  // Flips true once, right after mount — the idiomatic hydration guard
  // (react.dev's own recommended pattern for "different on server vs.
  // client" content) instead of computing the random pick inside the effect
  // itself, which would call setState with derived data on every
  // featuredEligible change and trip react-hooks/set-state-in-effect.
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);
  const featuredProjects = useMemo(() => {
    if (!hasMounted || featuredEligible.length <= FEATURED_SECTION_CAP) return featuredEligible.slice(0, FEATURED_SECTION_CAP);
    return weightedTake(featuredEligible, FEATURED_SECTION_CAP, (project) => planRotationWeight(project.package));
  }, [hasMounted, featuredEligible]);
  // Sorted by createdAt (when the row was actually added here), not
  // launchDate (the developer's own marketed date, often unset) — sorting
  // by launchDate meant a project with no launchDate could never surface on
  // this shelf, and the same handful of projects with one set showed up
  // indefinitely regardless of what was actually added recently.
  //
  // Time-boxed (owner's placement spec, 2026-09-24): a listing stays on this
  // shelf for 30 days after it went live (publishedAt, else createdAt — see
  // lib/new-listings.ts), then only its organic placement remains. If nothing
  // is that fresh the whole section is hidden rather than backfilled with old
  // listings.
  const newListings = useMemo(() => {
    const featuredSlugs = new Set(featuredProjects.map((project) => project.slug));
    const fresh = [...projects]
      .filter((project) => !featuredSlugs.has(project.slug))
      .filter((project) => !newListingsSince || isInNewListingsWindow(project, newListingsSince))
      .sort((a, b) => (b.publishedAt ?? b.createdAt ?? "").localeCompare(a.publishedAt ?? a.createdAt ?? ""));
    // Owner, 2026-10-21: keep rotating the shelf every day. Over 8 fresh listings, today's 8 are picked by a date-seeded shuffle.
    return rotationSeed ? dailyPick(fresh, 8, `new-${rotationSeed}`) : fresh.slice(0, 8);
  }, [projects, featuredProjects, newListingsSince, rotationSeed]);
  const landListings = useMemo(() => {
    const newestFirst = [...lands].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    // Land shelf rotates daily across every land listing, at most 2 per developer so one seller's block doesn't fill it.
    return rotationSeed ? dailyPick(newestFirst, 8, `land-${rotationSeed}`, { groupOf: (land) => land.developerSlug || land.developerName || land.slug, maxPerGroup: 2 }) : newestFirst.slice(0, 8);
  }, [lands, rotationSeed]);
  // Same suggestions as the header search: projects, land, developers, cities and collection pages (Luxury, Beachfront...).
  const [searchSuggestions, setSearchSuggestions] = useState<{ label: string; detail: string; href: string }[]>([]);
  useEffect(() => {
    const q = searchTerm.trim();
    if (q.length < 2) {
      const clear = setTimeout(() => setSearchSuggestions([]), 0);
      return () => clearTimeout(clear);
    }
    const timer = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`)
        .then((response) => response.json())
        .then((data) => setSearchSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []))
        .catch(() => setSearchSuggestions([]));
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const selectSearchSuggestion = (suggestion: { label: string; href: string }) => {
    setSearchTerm(suggestion.label);
    setDesktopSearchOpen(false);
    setMobileSearchOpen(false);
    router.push(suggestion.href);
  };
  // "Developer Spotlight" chip row (owner's 2026-09-24 build note) —
  // replaces the old hardcoded "Prime Lands" placeholder chip with the real
  // entitlement: any developer currently on Developer Pro/Campaign
  // (getPackage(plan).developerSpotlight — expiry-aware, see
  // effectivePlanTier) gets a highlighted chip here, linking to their
  // profile. If Prime Lands isn't actually on one of those plans yet, it
  // simply won't be highlighted anymore — that's the real feature working
  // correctly, not a regression. Capped at 3 so the row can't get crowded;
  // same hasMounted-gated weighted-by-plan pick as the Featured projects
  // section above once there are more eligible developers than that.
  const DEVELOPER_SPOTLIGHT_CAP = 3;
  const spotlightEligible = useMemo(
    () => developers.filter((developer) => getPackage(developer.plan).developerSpotlight).sort((a, b) => a.name.localeCompare(b.name)),
    [developers]
  );
  const spotlightDevelopers = useMemo(() => {
    if (!hasMounted || spotlightEligible.length <= DEVELOPER_SPOTLIGHT_CAP) return spotlightEligible.slice(0, DEVELOPER_SPOTLIGHT_CAP);
    return weightedTake(spotlightEligible, DEVELOPER_SPOTLIGHT_CAP, (developer) => planRotationWeight(developer.plan));
  }, [hasMounted, spotlightEligible]);
  const heroQuickLinks = [
    ...spotlightDevelopers.map((developer) => ({ path: `/developers/${developer.slug}`, breadcrumbLabel: developer.name, isHighlighted: true })),
    ...allProjectCategories,
    { path: "/land", breadcrumbLabel: "Lands" },
  ];

  return <div className="lnh-home">
    <div className="luxury-hero-two-bleed">
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
                className={`listing-filter-pill hero-quick-link-pill${"isHighlighted" in category && category.isHighlighted ? " hero-quick-link-pill-highlight" : ""}${category.path === "/land" ? " hero-quick-link-pill-land" : ""}`}
              >
                <span>{category.breadcrumbLabel}</span>
              </Link>
            ))}
          </div>
      </div>
    </section>
    </div>

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
      {/* Owner, 2026-10-01: live counts sit in their own box under the hero, same width as New listings. */}
      <section className="home-stats home-stats--row" aria-label="LankaNewHomes by the numbers">
        <p className="home-stats-lead">Live counts of what is listed on LankaNewHomes right now — straight from developers and builders.</p>
        <div className="home-stats-grid">
          <Link href="/projects" className="home-stat"><strong>{projects.length}</strong><span>Project Listings</span></Link>
          <Link href="/land" className="home-stat"><strong>{lands.length}</strong><span>Land Listings</span></Link>
          <Link href="/projects" className="home-stat"><strong>{floorPlanCount}</strong><span>Floor Plans</span></Link>
          <Link href="/land" className="home-stat"><strong>{landPlotTotal}</strong><span>Land Plots</span></Link>
        </div>
      </section>

      {featuredProjects.length > 0 ? (
        <section className="featured-projects-section" aria-label="Featured projects">
          <div className="featured-listings-head">
            <h2>Featured projects</h2>
            <p className="featured-listings-subhead">Promoted developments from our Featured and Developer Pro partners.</p>
          </div>
          <div className="featured-listings-shell">
            <div className="home-card-grid featured-listings-grid">
              {featuredProjects.map((project) => (
                <ListingGridCard key={`featured-${project.slug}`} project={project} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {newListings.length > 0 ? (
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
      ) : null}

      {landListings.length > 0 ? (
        <section className="new-listings-section land-listings-section" aria-label="Land for sale in Sri Lanka">
          <div className="featured-listings-head">
            <h2>Land for Sale in Sri Lanka</h2>
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
          {cityTiles.map((neighborhood) => (
            <Link href={`/search?city=${encodeURIComponent(neighborhood.name)}`} className="neighborhood-card" key={neighborhood.name}>
              <Image src={neighborhood.image} alt={neighborhood.name} fill quality={60} sizes="(max-width: 760px) 100vw, 33vw" />
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

      {priceBands.length > 0 ? (
        <section className="price-search-section" aria-label="Search by price">
          <div className="featured-listings-head">
            <h2>Search by price</h2>
            <p className="featured-listings-subhead">Start from your budget and see the new homes that fit it.</p>
          </div>
          <div className="price-bands">
            {priceBands.map((band) => (
              <Link href={`/search?q=${encodeURIComponent(band.q)}`} className="price-band" key={band.label}>
                <span className="price-band-range">{band.label}</span>
                <span className="price-band-count">{band.count} {band.count === 1 ? "project" : "projects"}</span>
                <span className="price-band-go">View homes <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Free-listing pitch to developers, right after "Explore by city" (owner, 2026-10-05; first placed after New listings
          on 2026-09-24). Not in the hero. */}
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
            List your project
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </Link>
          {/* "See pricing" removed (owner, 2026-09-24): /pricing is still being
              reviewed, unlinked from the whole site for now but kept live at
              its URL — not deleted, just not reachable by clicking around. */}
        </div>
      </section>

      {popularSearches.length > 0 ? (
      <section className="seo-links-section" aria-label="Popular searches">
        <div className="featured-listings-head">
          <h2>Popular searches</h2>
          <p className="featured-listings-subhead">Browse new homes, apartments, and land for sale across Sri Lanka by type and location.</p>
        </div>
        <div className="seo-links-grid">
          {popularSearches.map((group) => (
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
      ) : null}

    </main>
  </div>;
}
