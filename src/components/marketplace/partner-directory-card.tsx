import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin, Phone } from "lucide-react";

// Shared by every partner-directory listing page (architects, interior
// designers, marketing/sales companies, construction companies + its 3
// category pages) — was two near-identical, plainer copies of this same
// card (CompanyProfileListView and ConstructionCompanyShell) before this
// pass. One richer card, one place to change it.
export function PartnerDirectoryCard({
  slug,
  basePath,
  name,
  logo,
  location,
  description,
  yearsInBusiness,
  phone,
}: {
  slug: string;
  basePath: string;
  name: string;
  logo: string;
  location: string;
  description: string;
  yearsInBusiness?: number;
  phone?: string;
}) {
  return (
    <Link key={slug} href={`${basePath}/${slug}`} id={slug} className="partner-directory-card">
      <div className="partner-directory-card-logo">
        {logo ? (
          <Image src={logo} alt={`${name} logo`} width={72} height={72} className="partner-directory-card-logo-img" />
        ) : (
          <span className="partner-directory-card-logo-fallback" aria-hidden="true">
            {name.charAt(0)}
          </span>
        )}
      </div>

      <div className="partner-directory-card-body">
        <h2>{name}</h2>
        {location ? (
          <p className="partner-directory-card-location">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            {location}
          </p>
        ) : null}
        {description ? <p className="partner-directory-card-description">{description}</p> : null}

        {yearsInBusiness || phone ? (
          <div className="partner-directory-card-meta">
            {yearsInBusiness ? <span>{yearsInBusiness} years in business</span> : null}
            {phone ? (
              <span>
                <Phone className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                {phone}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <ArrowUpRight className="partner-directory-card-arrow h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
    </Link>
  );
}
