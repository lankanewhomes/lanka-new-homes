"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RequestInfoDialog } from "@/components/marketplace/components";
import { formatLkr } from "@/lib/format";
import type { Developer, Project } from "@/types";
import styles from "./listing-preview.module.css";

function hasValue(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && value !== "-";
}

function availabilityClass(availability: string) {
  if (availability === "Available") return styles.availAvailable;
  if (availability === "Limited") return styles.availLimited;
  return styles.availSold;
}

export function ListingPreviewPage({ project }: { project: Project; developer?: Developer }) {
  const [requestOpen, setRequestOpen] = useState(false);

  const statTiles = [
    hasValue(project.bedrooms) ? { label: "Bedrooms", value: project.bedrooms } : null,
    hasValue(project.bathrooms) ? { label: "Bathrooms", value: project.bathrooms } : null,
    hasValue(project.floorAreaRange) ? { label: "Floor area", value: project.floorAreaRange } : null,
    project.completionYear ? { label: "Move in", value: String(project.completionYear) } : null,
    hasValue(project.ownership) ? { label: "Ownership", value: project.ownership } : null,
  ].filter((f): f is { label: string; value: string } => Boolean(f));

  return (
    <div className={styles.page}>
      <p className={styles.previewBanner}>
        Design preview — this page is not linked from the site and doesn&apos;t affect the live listing.
      </p>

      <div className={styles.container}>
        <Link href={`/projects/${project.slug}`} className={styles.backLink}>
          ← Back to live listing
        </Link>

        <div className={`${styles.card} ${styles.headerCard}`}>
          <div>
            <div className={styles.pillRow}>
              <span className={`${styles.pill} ${styles.pillStatus}`}>{project.status}</span>
              <span className={`${styles.pill} ${styles.pillType}`}>{project.type}</span>
            </div>
            <h1 className={styles.title}>{project.name}</h1>
            <p className={styles.address}>{project.location}, {project.city}</p>
          </div>
          <div className={styles.priceBlock}>
            <p className={styles.priceValue}>{project.startingPriceLkr > 0 ? formatLkr(project.startingPriceLkr) : project.priceRange}</p>
            <button type="button" className={styles.requestButton} onClick={() => setRequestOpen(true)}>
              Request info
            </button>
          </div>
        </div>

        <div className={styles.statRow}>
          {statTiles.map((fact) => (
            <div key={fact.label} className={`${styles.card} ${styles.statTile}`}>
              <span className={styles.statLabel}>{fact.label}</span>
              <span className={styles.statValue}>{fact.value}</span>
            </div>
          ))}
        </div>

        <div className={`${styles.card} ${styles.section}`}>
          <h2 className={styles.sectionTitle}>About this home</h2>
          <p className={styles.description}>{project.summary}</p>
        </div>

        {project.gallery.length > 0 && (
          <div className={`${styles.card} ${styles.section}`}>
            <h2 className={styles.sectionTitle}>Photos</h2>
            <div className={styles.galleryGrid}>
              {project.gallery.slice(0, 6).map((item) => (
                <div key={item.image} className={styles.galleryItem}>
                  <Image src={item.image} alt={item.label} fill className={styles.galleryImage} />
                </div>
              ))}
            </div>
          </div>
        )}

        {project.floorPlans.length > 0 && (
          <div className={`${styles.card} ${styles.section}`}>
            <h2 className={styles.sectionTitle}>Floor plans</h2>
            <div className={styles.planGrid}>
              {project.floorPlans.map((plan) => (
                <div key={plan.id} className={styles.planCard}>
                  <div className={styles.planImages}>
                    <div className={styles.planImageWrap}>
                      <Image src={plan.image} alt={`${plan.planName} floor plan`} fill className={styles.planImage} />
                    </div>
                    <div className={styles.planImageWrap}>
                      <Image src={project.heroImage} alt={project.name} fill className={styles.planImage} />
                    </div>
                  </div>
                  <div className={styles.planBody}>
                    <div className={styles.planTopRow}>
                      <h3 className={styles.planName}>{plan.planName}</h3>
                      <span className={`${styles.planAvailability} ${availabilityClass(plan.availability)}`}>{plan.availability}</span>
                    </div>
                    <div className={styles.planMetaRow}>
                      <span>Bedrooms</span>
                      <span>{plan.bedrooms}</span>
                    </div>
                    <div className={styles.planMetaRow}>
                      <span>Bathrooms</span>
                      <span>{plan.bathrooms}</span>
                    </div>
                    <div className={styles.planMetaRow}>
                      <span>Floor area</span>
                      <span>{plan.floorAreaSqFt} sqft</span>
                    </div>
                    <p className={styles.planPrice}>{formatLkr(plan.startingPriceLkr)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {project.amenities.length > 0 && (
          <div className={`${styles.card} ${styles.section}`}>
            <h2 className={styles.sectionTitle}>Amenities</h2>
            <div className={styles.amenityRow}>
              {project.amenities.map((amenity) => (
                <span key={amenity.name} className={styles.amenityPill}>{amenity.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <RequestInfoDialog open={requestOpen} onClose={() => setRequestOpen(false)} project={project} />
    </div>
  );
}
