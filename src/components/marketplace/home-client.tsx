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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      heroSubtitle: "Search new condos, apartments, and villas from Colombo to the coast — pricing, floor plans, and availability updated by every developer.",
      searchPlaceholder: "Search projects & developments",
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
      heroSubtitle: "Search new condos, apartments, and villas from Colombo to the coast — pricing, floor plans, and availability updated by every developer.",
      searchPlaceholder: "திட்டங்கள் மற்றும் அபிவிருத்திகளைத் தேடுங்கள்",
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
      heroSubtitle: "Search new condos, apartments, and villas from Colombo to the coast — pricing, floor plans, and availability updated by every developer.",
      searchPlaceholder: "ව්‍යාපෘති සහ සංවර්ධන සොයන්න",
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
  const heroQuickLinks = [
    ...allProjectCategories,
    { path: "/land", breadcrumbLabel: "Lands" },
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
            {heroQuickLinks.map((category) => (
              <Link key={category.path} href={category.path} className="listing-filter-pill hero-quick-link-pill">
                <span>{category.breadcrumbLabel}</span>
              </Link>
            ))}
          </div>
      </div>
    </section>

    <main className="home-content">
      <section className="neighborhoods-section" aria-label="Find the city for you">
        <span className="section-kicker">Best city match</span>
        <h2>Find the City For You</h2>
        <p className="neighborhoods-subtitle">The cities best suited to your lifestyle, and the agents who know them best.</p>
        <h3 className="neighborhoods-subhead">New developments in Colombo</h3>
        <div className="neighborhoods-grid">
          {neighborhoods.map((neighborhood) => (
            <Link href="/search" className="neighborhood-card" key={neighborhood.name}>
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
          <span className="section-kicker section-kicker--warm">Editor’s picks</span>
          <h2>Featured listings</h2>
        </div>
        <p className="featured-listings-subtitle">A curated set of standout homes selected by LankaNewHomes editors.</p>
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
    </main>
  </div>;
}
