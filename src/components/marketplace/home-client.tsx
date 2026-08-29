"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, MapPin, Pause, Search } from "lucide-react";
import { SiteLanguage, useLanguage } from "@/components/layout/language-provider";
import { ListingGridCard } from "@/components/marketplace/listing-page";
import { allProjectCategories } from "@/lib/listing-categories";
import type { HeroAd, Project } from "@/types";

const colomboAreas = ["All", "Dehiwala", "Colombo 2", "Digana", "Colombo 3", "Colombo 9", "Piliyandala", "Hikkaduwa", "Athurugiriya", "Rajagiriya", "Battaramulla"];

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

type PromoCard = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
};

function Shelf({ title, items, regularTitle = false, locations = false, promoCard }: { title: string; items: Project[]; regularTitle?: boolean; locations?: boolean; promoCard?: PromoCard }) {
  const [startIndex, setStartIndex] = useState(0);
  const [locationStartIndex, setLocationStartIndex] = useState(0);
  const [pressedArrow, setPressedArrow] = useState<"prev" | "next" | null>(null);

  const flashArrow = (direction: "prev" | "next") => {
    setPressedArrow(direction);
    setTimeout(() => setPressedArrow(null), 180);
  };

  const visibleLocationAreas = useMemo(() => {
    if (!locations || !colomboAreas.length) return colomboAreas;
    return Array.from({ length: colomboAreas.length }, (_, i) => colomboAreas[(locationStartIndex + i) % colomboAreas.length]);
  }, [locations, locationStartIndex]);
  const visibleItems = useMemo(() => {
    if (locations) return items;
    if (!items.length) return [] as typeof items;
    return Array.from({ length: Math.min(items.length, 4) }, (_, i) => items[(startIndex + i) % items.length]);
  }, [items, locations, startIndex]);

  const showPrev = () => {
    flashArrow("prev");
    if (locations) {
      if (!colomboAreas.length) return;
      setLocationStartIndex((prev) => (prev - 1 + colomboAreas.length) % colomboAreas.length);
      return;
    }
    if (!items.length) return;
    setStartIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const showNext = () => {
    flashArrow("next");
    if (locations) {
      if (!colomboAreas.length) return;
      setLocationStartIndex((prev) => (prev + 1) % colomboAreas.length);
      return;
    }
    if (!items.length) return;
    setStartIndex((prev) => (prev + 1) % items.length);
  };

  return <section className="home-shelf">
    <div className="shelf-heading"><h2 className={regularTitle ? "regular-title" : undefined}>{title}</h2><div className="shelf-arrows"><button type="button" aria-label="Previous" disabled={!locations && items.length <= 1} className={pressedArrow === "prev" ? "pressed" : undefined} onClick={showPrev}><ChevronLeft /></button><button type="button" aria-label="Next" disabled={!locations && items.length <= 1} className={pressedArrow === "next" ? "pressed" : undefined} onClick={showNext}><ChevronRight /></button></div></div>
    {locations && <div className="location-chip-row" aria-label="Filter homes by location">{visibleLocationAreas.map((area) => <button key={area} className={area === "Colombo 3" ? "active" : undefined}>{area}</button>)}
      <span className="location-chip-photo" aria-hidden="true"><Image src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=500&auto=format&fit=crop" alt="" width={96} height={42} /></span>
      <span className="location-chip-photo" aria-hidden="true"><Image src="https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=500&auto=format&fit=crop" alt="" width={96} height={42} /></span>
      <span className="location-chip-photo" aria-hidden="true"><Image src="https://images.unsplash.com/photo-1600047509782-20d39509f26d?q=80&w=500&auto=format&fit=crop" alt="" width={96} height={42} /></span>
    </div>}
    <div className="home-card-grid">{visibleItems.map((project, index) => <ListingGridCard key={`${project.slug}-${index}`} project={project} />)}{promoCard ? <article className="home-exclusive-card"><p className="exclusive-eyebrow">{promoCard.eyebrow}</p><h3>{promoCard.title}</h3><p>{promoCard.body}</p><Link href="/search">{promoCard.cta}</Link></article> : null}</div>
  </section>;
}

export function HomeClient({ projects }: { projects: Project[] }) {
  const { language } = useLanguage();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [heroSlide, setHeroSlide] = useState(0);
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
    setHeroSlide((current) => (current >= heroSlides.length ? 0 : current));
  }, [heroSlides.length]);

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
  };

  const copy: Record<SiteLanguage, {
    shelfTrending: string;
    shelfFeatured: string;
    shelfLaunching: string;
    heroTitle: string;
    heroSubtitle: string;
    searchPlaceholder: string;
    searchRegion: string;
    searchButton: string;
    communities: string;
    viewAll: string;
    trendingExclusiveEyebrow: string;
    trendingExclusiveTitle: string;
    trendingExclusiveBody: string;
    trendingExclusiveCta: string;
    adLabel: string;
    adTitle: string;
    adText: string;
    adCta: string;
  }> = {
    en: {
      shelfTrending: "New homes trending across Sri Lanka",
      shelfFeatured: "Featured new home communities",
      shelfLaunching: "New communities launching soon",
      heroTitle: "New homes for sale across Sri Lanka",
      heroSubtitle: "Search new condos, apartments, and villas from Colombo to the coast — pricing, floor plans, and availability updated by every developer.",
      searchPlaceholder: "Search projects & developments",
      searchRegion: "All of Sri Lanka",
      searchButton: "Search",
      communities: "Communities",
      viewAll: "View all",
      trendingExclusiveEyebrow: "LankaLiving private exclusives",
      trendingExclusiveTitle: "Unlock 5,070+ more homes",
      trendingExclusiveBody: "LankaLiving has Sri Lanka's most accurate new-construction catalog, backed by trusted expertise.",
      trendingExclusiveCta: "See private exclusives",
      adLabel: "Advertisement",
      adTitle: "Showcase your new development on LankaLiving",
      adText: "Reach active Sri Lankan buyers searching for newly launched communities.",
      adCta: "Promote your listing",
    },
    ta: {
      shelfTrending: "இலங்கை முழுவதும் பிரபலமான புதிய வீடுகள்",
      shelfFeatured: "சிறப்பு புதிய வீட்டு சமூகங்கள்",
      shelfLaunching: "விரைவில் தொடங்கும் புதிய சமூகங்கள்",
      heroTitle: "New homes for sale across Sri Lanka",
      heroSubtitle: "Search new condos, apartments, and villas from Colombo to the coast — pricing, floor plans, and availability updated by every developer.",
      searchPlaceholder: "திட்டங்கள் மற்றும் அபிவிருத்திகளைத் தேடுங்கள்",
      searchRegion: "இலங்கை முழுவதும்",
      searchButton: "தேடல்",
      communities: "சமூகங்கள்",
      viewAll: "அனைத்தையும் காண்க",
      trendingExclusiveEyebrow: "LankaLiving தனியார் சிறப்பு பட்டியல்கள்",
      trendingExclusiveTitle: "5,070+ கூடுதல் வீடுகளை திறக்கவும்",
      trendingExclusiveBody: "LankaLiving has Sri Lanka's most accurate new-construction catalog, backed by trusted expertise.",
      trendingExclusiveCta: "தனியார் பட்டியல்களைப் பார்க்க",
      adLabel: "விளம்பரம்",
      adTitle: "LankaLiving இல் உங்கள் புதிய திட்டத்தை முன்னிறுத்துங்கள்",
      adText: "புதிய சமூகங்களை தேடும் செயலில் உள்ள இலங்கை வாங்குபவர்களை அடையுங்கள்.",
      adCta: "உங்கள் பட்டியலை விளம்பரப்படுத்து",
    },
    si: {
      shelfTrending: "ශ්‍රී ලංකාව පුරා ප්‍රවණ නව නිවාස",
      shelfFeatured: "විශේෂ නව නිවාස ප්‍රජාවන්",
      shelfLaunching: "ඉක්මනින් ආරම්භ වන නව ප්‍රජාවන්",
      heroTitle: "New homes for sale across Sri Lanka",
      heroSubtitle: "Search new condos, apartments, and villas from Colombo to the coast — pricing, floor plans, and availability updated by every developer.",
      searchPlaceholder: "ව්‍යාපෘති සහ සංවර්ධන සොයන්න",
      searchRegion: "ශ්‍රී ලංකාව පුරා",
      searchButton: "සොයන්න",
      communities: "ප්‍රජාවන්",
      viewAll: "සියල්ල බලන්න",
      trendingExclusiveEyebrow: "LankaLiving පුද්ගලික විශේෂ ලැයිස්තු",
      trendingExclusiveTitle: "5,070+ අමතර නිවාස අගුළු අරින්න",
      trendingExclusiveBody: "LankaLiving has Sri Lanka's most accurate new-construction catalog, backed by trusted expertise.",
      trendingExclusiveCta: "පුද්ගලික ලැයිස්තු බලන්න",
      adLabel: "ප්‍රචාරණය",
      adTitle: "LankaLiving තුළ ඔබගේ නව සංවර්ධනය ප්‍රදර්ශනය කරන්න",
      adText: "නව ප්‍රජාවන් සොයන ක්‍රියාශීලී ශ්‍රී ලාංකික මිලදී ගන්නන් වෙත ළඟා වන්න.",
      adCta: "ඔබගේ ලැයිස්තුගත කිරීම ප්‍රවර්ධනය කරන්න",
    },
  };

  const t = copy[language];

  const featuredProjects = useMemo(() => projects.filter((project) => project.isFeatured).slice(0, 4), [projects]);

  const shelves = [
    { title: t.shelfTrending, projects },
    { title: t.shelfFeatured, projects: featuredProjects },
  ];

  return <div className="livabl-home">
    <section className="luxury-hero-two" aria-label="Luxury listing search hero">
      <div className="luxury-hero-two-media">
        <div className="luxury-hero-two-track" style={{ transform: `translateX(-${heroSlide * 100}%)` }}>
          {heroSlides.map((slide, index) => <div className="luxury-hero-two-slide" key={`${slide.src}-${index}`}><Link href={slide.href} className="luxury-hero-two-slide-link" aria-hidden={index !== heroSlide} tabIndex={index === heroSlide ? 0 : -1}><Image src={slide.src} alt={index === heroSlide ? slide.alt : ""} fill priority={index === 0} sizes="100vw" /></Link></div>)}
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
            <label><input aria-label="Search homes" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={t.searchPlaceholder} /></label>
            <button type="button" className="hero-region-picker" aria-label="Select region"><MapPin size={17} /><span>{t.searchRegion}</span><ChevronDown size={16} /></button>
            <button type="submit" aria-label={t.searchButton} className="hero-search-submit"><Search size={19} /></button>
          </form>
          <div className="hero-quick-links" aria-label="Browse by category">
            {allProjectCategories.map((category) => (
              <Link key={category.path} href={category.path} className="listing-filter-pill hero-quick-link-pill">
                <span>{category.breadcrumbLabel}</span>
              </Link>
            ))}
          </div>
      </div>
    </section>

    <main className="home-content">
      <section className="neighborhoods-section" aria-label="Find the city for you">
        <h2>Find the City For You</h2>
        <p className="neighborhoods-subtitle">The cities best suited to your lifestyle, and the agents who know them best.</p>
        <div className="neighborhoods-grid">
          {neighborhoods.map((neighborhood) => (
            <Link href="/search" className="neighborhood-card" key={neighborhood.name}>
              <Image src={neighborhood.image} alt={neighborhood.name} fill sizes="(max-width: 760px) 100vw, 33vw" />
              <span className="neighborhood-card-overlay" />
              <span className="neighborhood-card-title">{neighborhood.name}</span>
            </Link>
          ))}
        </div>
        <Link href="/search" className="neighborhoods-more-link">View more cities</Link>
      </section>

      <section className="featured-listings-section" aria-label="Featured listings">
        <div className="featured-listings-head">
          <h2>Featured listings</h2>
        </div>
        <p className="featured-listings-subtitle">A curated set of standout homes selected by LankaLiving editors.</p>
        <div className="featured-listings-shell">
          <div className="home-card-grid featured-listings-grid">
            {featuredProjects.map((project) => (
              <ListingGridCard key={`featured-${project.slug}`} project={project} />
            ))}
          </div>
          <div className="featured-listings-footer">
            <Link href="/search" className="featured-listings-button">View all listings</Link>
          </div>
        </div>
      </section>

      <section className="trending-homes-section">
        <Shelf title={shelves[0].title} items={shelves[0].projects} regularTitle locations promoCard={{ eyebrow: t.trendingExclusiveEyebrow, title: t.trendingExclusiveTitle, body: t.trendingExclusiveBody, cta: t.trendingExclusiveCta }} />
      </section>
    </main>
  </div>;
}
