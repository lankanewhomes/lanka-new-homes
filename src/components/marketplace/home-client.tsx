"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, MapPin, Pause, Search, X } from "lucide-react";
import { SiteLanguage, useLanguage } from "@/components/layout/language-provider";
import { ListingGridCard } from "@/components/marketplace/listing-page";
import { allProjectCategories } from "@/lib/listing-categories";
import type { Developer, HeroAd, Project } from "@/types";

const neighborhoods = [
  { name: "Colombo", image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=900&auto=format&fit=crop" },
  { name: "Kandy", image: "https://images.unsplash.com/photo-1546708973-b339540b5162?q=80&w=900&auto=format&fit=crop" },
  { name: "Galle", image: "https://images.unsplash.com/photo-1531572753322-ad063cecc140?q=80&w=900&auto=format&fit=crop" },
  { name: "Negombo", image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=900&auto=format&fit=crop" },
  { name: "Ella", image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=900&auto=format&fit=crop" },
  { name: "Jaffna", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=900&auto=format&fit=crop" },
  { name: "Nuwara Eliya", image: "https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9?q=80&w=900&auto=format&fit=crop" },
  { name: "Trincomalee", image: "https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?q=80&w=900&auto=format&fit=crop" },
];

const fallbackHeroSlides = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=85&w=2600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=85&w=2600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=85&w=2600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=85&w=2600&auto=format&fit=crop",
];

export function HomeClient({ projects, developers = [] }: { projects: Project[]; developers?: Developer[] }) {
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

  const heroSlides = useMemo(() => (
    heroAds.length > 0
      ? heroAds.map((ad) => ({ src: ad.image, href: ad.linkUrl, alt: ad.headline }))
      : fallbackHeroSlides.map((src) => ({ src, href: "/search", alt: "Luxury property lifestyle hero image" }))
  ), [heroAds]);

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

  const featuredProjects = useMemo(() => projects.filter((project) => project.isFeatured).slice(0, 4), [projects]);
  // Same de-dupe-by-name logic as /developers (a builder can have more than
  // one profile row) — most active/complete profile wins — then the ones
  // with the most combined projects lead, since that's what "featured"
  // means here absent a dedicated flag on Developer.
  const featuredBuilders = useMemo(() => {
    const unique = developers.reduce((map, developer) => {
      const key = developer.name.trim().toLowerCase();
      const current = map.get(key);
      const currentScore = current ? current.activeProjects + current.completedProjects + Number(Boolean(current.location)) : -1;
      const nextScore = developer.activeProjects + developer.completedProjects + Number(Boolean(developer.location));
      if (!current || nextScore > currentScore) map.set(key, developer);
      return map;
    }, new Map<string, Developer>());
    return Array.from(unique.values())
      .sort((a, b) => (b.activeProjects + b.completedProjects) - (a.activeProjects + a.completedProjects))
      .slice(0, 8);
  }, [developers]);
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
              <Link key={category.path} href={category.path} className="listing-filter-pill hero-quick-link-pill">
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
      <section className="neighborhoods-section" aria-label="Find the city for you">
        <div className="featured-listings-head">
          <h2>Explore by city</h2>
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
        <Link href="/search" className="neighborhood-section-explore">View more cities</Link>
      </section>

      <section className="featured-listings-section" aria-label="Featured listings">
        <div className="featured-listings-head">
          <h2>Featured listings</h2>
        </div>
        <div className="featured-listings-shell">
          <div className="home-card-grid featured-listings-grid">
            {featuredProjects.map((project) => (
              <ListingGridCard key={`featured-${project.slug}`} project={project} />
            ))}
          </div>
          <div className="featured-listings-footer">
            <Link href="/search" className="featured-listings-button">VIEW ALL LISTINGS</Link>
          </div>
        </div>
      </section>

      {featuredBuilders.length > 0 ? (
        <section className="featured-listings-section" aria-label="Featured builders">
          <div className="featured-listings-head">
            <h2>Featured builders</h2>
          </div>
          <div className="featured-listings-shell">
            <div className="featured-builders-grid">
              {featuredBuilders.map((developer) => (
                <Link key={developer.slug} href={`/developers/${developer.slug}`} className="featured-builder-card">
                  <span className="featured-builder-card-logo">
                    <Image src={developer.logo} alt={developer.name} width={120} height={120} />
                  </span>
                  <span className="featured-builder-card-name">{developer.name}</span>
                  <span className="featured-builder-card-count">
                    {developer.activeProjects + developer.completedProjects} project{developer.activeProjects + developer.completedProjects === 1 ? "" : "s"}
                  </span>
                </Link>
              ))}
            </div>
            <div className="featured-listings-footer">
              <Link href="/developers" className="featured-listings-button">VIEW ALL BUILDERS</Link>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  </div>;
}
