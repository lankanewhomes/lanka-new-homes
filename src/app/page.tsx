"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, House, MapPin, Pause, Search } from "lucide-react";
import { SiteLanguage, useLanguage } from "@/components/layout/language-provider";
import { developers } from "@/data/developers";
import { projects } from "@/data/projects";
import { formatLkr } from "@/lib/format";

const colomboAreas = ["All", "Dehiwala", "Colombo 2", "Digana", "Colombo 3", "Colombo 9", "Piliyandala", "Hikkaduwa", "Athurugiriya", "Rajagiriya", "Battaramulla"];

type PromoCard = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
};

function Shelf({ title, items, regularTitle = false, locations = false, promoCard }: { title: string; items: typeof projects; regularTitle?: boolean; locations?: boolean; promoCard?: PromoCard }) {
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
    return Array.from({ length: items.length }, (_, i) => items[(startIndex + i) % items.length]);
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
    <div className="shelf-heading"><h2 className={regularTitle ? "regular-title" : undefined}>{title}</h2><div className="shelf-arrows"><button type="button" aria-label="Previous" className={pressedArrow === "prev" ? "pressed" : undefined} onClick={showPrev}><ChevronLeft /></button><button type="button" aria-label="Next" className={pressedArrow === "next" ? "pressed" : undefined} onClick={showNext}><ChevronRight /></button></div></div>
    {locations && <div className="location-chip-row" aria-label="Filter homes by location">{visibleLocationAreas.map((area) => <button key={area} className={area === "Colombo 3" ? "active" : undefined}>{area}</button>)}
      <span className="location-chip-photo" aria-hidden="true"><Image src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=500&auto=format&fit=crop" alt="" width={96} height={42} /></span>
      <span className="location-chip-photo" aria-hidden="true"><Image src="https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=500&auto=format&fit=crop" alt="" width={96} height={42} /></span>
      <span className="location-chip-photo" aria-hidden="true"><Image src="https://images.unsplash.com/photo-1600047509782-20d39509f26d?q=80&w=500&auto=format&fit=crop" alt="" width={96} height={42} /></span>
    </div>}
    <div className="home-card-grid">{visibleItems.map((project, index) => <Link href={`/projects/${project.slug}`} className="home-project-card" key={`${project.slug}-${index}`}>
      <div className="home-project-image-wrap">
        <Image src={project.heroImage} alt={project.name} width={640} height={390} />
      </div>
      <h3>{project.name}</h3><p>{project.status === "Coming Soon" ? "Register now" : `From ${formatLkr(project.startingPriceLkr)}`}</p>
      <div className="home-card-meta"><small>{project.location}</small></div>
    </Link>)}{promoCard ? <article className="home-exclusive-card"><p className="exclusive-eyebrow">{promoCard.eyebrow}</p><h3>{promoCard.title}</h3><p>{promoCard.body}</p><Link href="/search">{promoCard.cta}</Link></article> : null}</div>
  </section>;
}

export default function Home() {
  const { language } = useLanguage();
  const [showAllCities, setShowAllCities] = useState(false);

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
      heroTitle: "Building new home dreams",
      heroSubtitle: "Find your new construction home",
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
      heroTitle: "Building new home dreams",
      heroSubtitle: "Find your new construction home",
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
      heroTitle: "Building new home dreams",
      heroSubtitle: "Find your new construction home",
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

  const shelves = [
    { title: t.shelfTrending, projects: [projects[0], projects[1], projects[0], projects[1], projects[0], projects[1], projects[0]] },
    { title: t.shelfFeatured, projects: [projects[1], projects[0], projects[1], projects[0]] },
  ];

  const featuredCityLinks = [
    "Colombo new homes",
    "Kandy new homes",
    "Galle new homes",
    "Negombo new homes",
    "Rajagiriya new homes",
    "Nugegoda new homes",
    "Battaramulla new homes",
    "Dehiwala new homes",
    "Kotte new homes",
    "Mount Lavinia new homes",
    "Malabe new homes",
    "Wattala new homes",
  ];

  const extraCityLinks = [
    "Ja-Ela new homes",
    "Homagama new homes",
    "Moratuwa new homes",
    "Kalutara new homes",
    "Kurunegala new homes",
    "Matara new homes",
    "Trincomalee new homes",
    "Jaffna new homes",
  ];

  const cityLinks = showAllCities ? [...featuredCityLinks, ...extraCityLinks] : featuredCityLinks;

  return <div className="livabl-home">
    <section className="luxury-hero-two" aria-label="Luxury listing search hero">
      <div className="luxury-hero-two-media">
        <Image src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=85&w=2600&auto=format&fit=crop" alt="Luxury property lifestyle hero image" fill sizes="100vw" />
        <div className="luxury-hero-two-overlay" />
        <div className="luxury-hero-two-extra-photos" aria-hidden="true">
          <Image src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=900&auto=format&fit=crop" alt="" width={220} height={140} />
          <Image src="https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=900&auto=format&fit=crop" alt="" width={180} height={118} />
        </div>
        <div className="luxury-hero-two-collection">The Spring & Summer Collection</div>
        <button type="button" className="luxury-hero-two-arrow" aria-label="Previous slide">
          <ChevronLeft size={18} />
        </button>
        <button type="button" className="luxury-hero-two-arrow luxury-hero-two-arrow-right" aria-label="Next slide">
          <ChevronRight size={18} />
        </button>
        <div className="luxury-hero-two-pagination" aria-label="Slide pagination">
          <span className="active" />
          <span />
          <span />
          <span />
        </div>
        <button type="button" className="luxury-hero-two-pause" aria-label="Pause slideshow">
          <Pause size={16} />
        </button>
      </div>

      <div className="luxury-hero-two-panel">
        <h2>Make yourself at home.</h2>
        <p className="luxury-hero-two-subheading">Discover curated new developments and premium homes across Sri Lanka.</p>
        <form className="hero-search luxury-hero-two-top-search">
          <label><Search size={19} /><input aria-label="Search homes" placeholder={t.searchPlaceholder} /></label>
          <button type="button" className="hero-region-picker" aria-label="Select region"><MapPin size={17} /><span>{t.searchRegion}</span><ChevronDown size={16} /></button>
          <Link href="/search" aria-label={t.searchButton}><Search size={18} /></Link>
        </form>
      </div>
    </section>

    <main className="home-content">
      <section className="featured-listings-section" aria-label="Featured listings">
        <div className="featured-listings-head">
          <h2>Featured listings</h2>
        </div>
        <p className="featured-listings-subtitle">A curated set of standout homes selected by LankaLiving editors.</p>
        <div className="featured-listings-shell">
          <div className="home-card-grid featured-listings-grid">
            {[...projects, ...projects].slice(0, 4).map((project, index) => (
              <Link href={`/projects/${project.slug}`} className="home-project-card" key={`featured-${project.slug}-${index}`}>
                <div className="home-project-image-wrap">
                  <Image src={project.heroImage} alt={project.name} width={640} height={390} />
                </div>
                <h3>{project.name}</h3>
                <p>{project.status === "Coming Soon" ? "Register now" : `From ${formatLkr(project.startingPriceLkr)}`}</p>
                <div className="home-card-meta"><small>{project.location}</small></div>
              </Link>
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
      <section className="builders-section"><div className="section-title"><House /><h2>Builders</h2><span className="orange-swoop">⌁</span></div><div className="shelf-heading"><h2>Top new construction builders</h2><div className="shelf-arrows"><button aria-label="Previous"><ChevronLeft /></button><button aria-label="Next"><ChevronRight /></button></div></div><div className="builder-grid">{[...developers, ...developers].map((developer, index) => <Link href={`/developers/${developer.slug}`} key={`${developer.slug}-${index}`} className="builder-card"><Image src={developer.logo} alt={developer.name} width={210} height={130} /><h3>{developer.name}</h3><p>★★★★★ <small>{8 + index}</small></p></Link>)}</div></section>
    </main>
    <section className="location-links"><div><h2>Top new home locations in Sri Lanka</h2><div className="link-columns">{cityLinks.map(x => <Link href="/search" key={x}>{x}</Link>)}</div><button type="button" className="show-more-cities" onClick={() => setShowAllCities((prev) => !prev)} aria-expanded={showAllCities}>Show more cities <ChevronDown size={16} className={showAllCities ? "rotate" : undefined} /></button><h2>Browse new homes by province</h2><div className="link-columns provinces">{["Western Province new homes", "Central Province new homes", "Southern Province new homes", "North Western Province new homes"].map(x => <Link href="/search" key={x}>{x}</Link>)}</div></div></section>
  </div>;
}
