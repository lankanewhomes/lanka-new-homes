"use client";

import Image from "next/image";
import Link from "next/link";

// Desktop header mega menu (owner, 2026-11-20): a full-width white panel under the header with bold column
// headings, plain link lists, and a row of two of "Featured listings" photo tiles on the right.
// The link lists live here so the phone menu and the desktop panel read from one place.
export type MegaLink = { label: string; href: string };
export type MegaColumn = { heading: string; links: MegaLink[] };
export type MegaTile = { name: string; place: string; href: string; image: string; featured: boolean; paid?: boolean };
export type MegaKey = "homes" | "land" | "company";

export const MEGA_MENUS: Record<MegaKey, { columns: MegaColumn[]; tilesHeading: string; tiles: "projects" | "lands"; viewAll: MegaLink }> = {
  homes: {
    columns: [
      {
        heading: "Trending",
        links: [
          { label: "All new homes", href: "/projects" },
          { label: "Pre-construction", href: "/projects/pre-construction" },
          { label: "Luxury", href: "/projects/luxury" },
          { label: "Beachfront", href: "/projects/beachfront" },
          { label: "Lakefront", href: "/projects/lakefront" },
          { label: "Branded residences", href: "/projects/branded-residences" },
          { label: "Port City Colombo", href: "/projects/port-city-colombo" },
        ],
      },
      {
        heading: "By type",
        links: [
          { label: "Condominium", href: "/projects?type=Condominium" },
          { label: "Apartments", href: "/projects?type=Apartments" },
          { label: "Villas", href: "/projects?type=Villas" },
          { label: "Mixed Use", href: "/projects?type=Mixed+Use" },
          { label: "Housing", href: "/projects?type=Housing" },
          { label: "Township Developments", href: "/projects?type=Township+Developments" },
          { label: "Private Residence", href: "/projects?type=Private+Residence" },
          { label: "Townhouse", href: "/projects?type=Townhouse" },
        ],
      },
      {
        heading: "By city",
        links: [
          { label: "Colombo", href: "/projects/colombo" },
          { label: "Rajagiriya", href: "/projects/apartments-for-sale-in-rajagiriya" },
          { label: "Dehiwala", href: "/projects/apartments-for-sale-in-dehiwala" },
          { label: "Mount Lavinia", href: "/projects/apartments-for-sale-in-mount-lavinia" },
          { label: "Negombo", href: "/projects/houses-for-sale-in-negombo" },
          { label: "Kandy", href: "/projects/houses-for-sale-in-kandy" },
          { label: "Galle", href: "/projects/houses-for-sale-in-galle" },
        ],
      },
      {
        heading: "Buyer guides",
        links: [
          { label: "Apartment prices in Colombo", href: "/guides/apartment-prices-in-colombo" },
          { label: "House prices in Sri Lanka", href: "/guides/house-prices-in-sri-lanka" },
          { label: "Foreigners buying property", href: "/guides/foreigners-buying-property" },
          { label: "Investment property", href: "/guides/investment-property" },
          { label: "Neighborhoods", href: "/neighborhoods" },
        ],
      },
    ],
    tilesHeading: "Featured listings",
    tiles: "projects",
    viewAll: { label: "View all new homes", href: "/projects" },
  },
  land: {
    columns: [
      {
        heading: "By use",
        links: [
          { label: "All land", href: "/land" },
          { label: "Residential", href: "/land?landUse=Residential" },
          { label: "Commercial", href: "/land?landUse=Commercial" },
          { label: "Agricultural", href: "/land?landUse=Agricultural" },
          { label: "Mixed Use", href: "/land?landUse=Mixed+Use" },
        ],
      },
      {
        heading: "By city",
        links: [
          { label: "Colombo", href: "/land/best-land-for-sale-in-colombo" },
          { label: "Homagama", href: "/land/land-for-sale-in-homagama" },
          { label: "Malabe", href: "/land/land-for-sale-in-malabe" },
          { label: "Athurugiriya", href: "/land/land-for-sale-in-athurugiriya" },
          { label: "Kadawatha", href: "/land/land-for-sale-in-kadawatha" },
          { label: "Piliyandala", href: "/land/land-for-sale-in-piliyandala" },
          { label: "Kaduwela", href: "/land/land-for-sale-in-kaduwela" },
          { label: "Horana", href: "/land/land-for-sale-in-horana" },
        ],
      },
      {
        heading: "Popular searches",
        links: [
          { label: "Cheap land", href: "/land/cheap-land-for-sale-in-sri-lanka" },
          { label: "1 acre land", href: "/land/1-acre-land-for-sale-in-sri-lanka" },
          { label: "Farm land", href: "/land/farm-land-for-sale-in-sri-lanka" },
          { label: "Rural land", href: "/land/rural-land-for-sale-in-sri-lanka" },
          { label: "Guide: buy land in Sri Lanka", href: "/guides/buy-land-in-sri-lanka" },
        ],
      },
    ],
    tilesHeading: "Featured land",
    tiles: "lands",
    viewAll: { label: "View all land", href: "/land" },
  },
  company: {
    columns: [
      {
        heading: "Company",
        links: [
          { label: "About", href: "/about" },
          { label: "Contact", href: "/contact" },
          { label: "Blog", href: "/blog" },
          { label: "Press", href: "/press" },
        ],
      },
      {
        heading: "Explore",
        links: [
          { label: "Developers", href: "/developers" },
          { label: "Neighborhoods", href: "/neighborhoods" },
          { label: "Guides", href: "/guides" },
          { label: "Construction companies", href: "/construction-companies" },
          { label: "Architects", href: "/architects" },
          { label: "Interior designers", href: "/interior-designers" },
        ],
      },
      {
        heading: "For developers",
        links: [
          { label: "Why list with us", href: "/for-developers" },
          { label: "Website design for developers", href: "/web-design" },
          { label: "Developer register", href: "/developers/register" },
          { label: "Developer login", href: "/developers/login" },
        ],
      },
    ],
    tilesHeading: "Featured listings",
    tiles: "projects",
    viewAll: { label: "View all new homes", href: "/projects" },
  },
};

export function NavMegaPanel({ menuKey, tiles, onNavigate }: { menuKey: MegaKey; tiles: MegaTile[]; onNavigate: () => void }) {
  const menu = MEGA_MENUS[menuKey];
  return (
    <div className="nav-mega">
      <div className="nav-mega-inner">
        <div className="nav-mega-columns">
          {menu.columns.map((column) => (
            <div key={column.heading} className="nav-mega-column">
              <p className="nav-mega-heading">{column.heading}</p>
              {column.links.map((link) => (
                <Link key={link.href} href={link.href} onClick={onNavigate}>{link.label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="nav-mega-featured">
          <p className="nav-mega-heading nav-mega-featured-heading">{menu.tilesHeading}</p>
          {tiles.length > 0 ? (
            <div className="nav-mega-tiles">
              {tiles.map((tile) => (
                <Link key={tile.href} href={tile.href} className="nav-mega-tile" onClick={onNavigate}>
                  <Image src={tile.image} alt="" fill sizes="190px" />
                  {tile.paid ? <span className="fp-badge nav-mega-tile-badge">Featured</span> : null}
                  <span className="nav-mega-tile-text">
                    <strong>{tile.name}</strong>
                    {tile.place ? <small>{tile.place}</small> : null}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="nav-mega-tiles" aria-hidden="true">
              <span className="nav-mega-tile nav-mega-tile-empty" /><span className="nav-mega-tile nav-mega-tile-empty" />
              <span className="nav-mega-tile nav-mega-tile-empty" /><span className="nav-mega-tile nav-mega-tile-empty" />
            </div>
          )}
          <Link href={menu.viewAll.href} className="nav-mega-view-all" onClick={onNavigate}>{menu.viewAll.label}</Link>
        </div>
      </div>
    </div>
  );
}
