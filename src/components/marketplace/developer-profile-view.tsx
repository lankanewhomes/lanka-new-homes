"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Heart, House, Star, X } from "lucide-react";
import type { Developer, Project, Review } from "@/types";
import { formatLkr, formatOfficeHours } from "@/lib/format";
import { SOCIAL_ICON } from "@/components/marketplace/components";
import { useSavedDeveloper } from "@/lib/use-saved-developer";
import { Button } from "@/components/ui/button";

type Tab = "projects" | "reviews" | "awards" | "press";

export function DeveloperProfileView({ developer, projects, reviews = [] }: { developer: Developer; projects: Project[]; reviews?: Review[] }) {
  const [tab, setTab] = useState<Tab>("projects");
  const { saved: following, toggle: toggleFollow } = useSavedDeveloper(developer.slug);
  const [locationFilter, setLocationFilter] = useState("all");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const formattedOfficeHours = formatOfficeHours(developer.officeHours);
  const coDevelopers = (developer.coDevelopers ?? []).filter((entry) => entry.name);
  const socialEntries = Object.entries(developer.socialLinks ?? {}).filter(([, url]) => Boolean(url)) as [string, string][];

  const locations = useMemo(() => Array.from(new Set(projects.map((project) => project.location))).sort(), [projects]);

  const visibleProjects = locationFilter === "all" ? projects : projects.filter((project) => project.location === locationFilter);

  const averageRating = reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  return (
    <div className="developer-profile">
      <aside className="developer-profile-sidebar">
        <div className="developer-profile-logo">
          <div className={developer.logo.startsWith("/") ? "developer-profile-logo-chip" : undefined}>
            <Image src={developer.logo} alt={developer.name} width={220} height={90} />
          </div>
        </div>
        <h1>{developer.name}</h1>
        <p className="developer-profile-role">Developer</p>
        <p className="developer-profile-reviews">
          {reviews.length > 0 ? (
            <>
              <Star size={14} className="developer-profile-reviews-star" fill="#f47b36" /> {averageRating.toFixed(1)} · {reviews.length} Review{reviews.length === 1 ? "" : "s"}
            </>
          ) : (
            "0 Reviews"
          )}
        </p>
        <button type="button" className="developer-profile-review-button" onClick={() => setReviewDialogOpen(true)}>Write a review <Star size={16} /></button>
        <button
          type="button"
          className={`developer-profile-follow-button${following ? " is-following" : ""}`}
          onClick={toggleFollow}
          aria-pressed={following}
        >
          <Heart size={16} className={following ? "text-[#d94f4f]" : undefined} fill={following ? "#d94f4f" : "none"} />
          {following ? "Following" : "Follow developer"}
        </button>

        <div className="developer-profile-contact">
          <p>{developer.location}</p>
          <p>{developer.phone}</p>
          {developer.website ? <a href={developer.website} target="_blank" rel="noopener noreferrer">{developer.website.replace(/^https?:\/\//, "")}</a> : null}
        </div>

        {socialEntries.length > 0 ? (
          <div className="developer-profile-socials" aria-label="Social media">
            {socialEntries.map(([platform, url]) => {
              const Icon = SOCIAL_ICON[platform];
              if (!Icon) return null;
              return (
                <a key={platform} href={url} target="_blank" rel="noreferrer noopener" aria-label={`Visit us on ${platform}`}>
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        ) : null}

        {formattedOfficeHours.length > 0 ? (
          <div className="developer-profile-hours">
            <p className="developer-profile-hours-title">Hours</p>
            {formattedOfficeHours.map((row) => (
              <p key={row.label}>{row.label} <span>{row.value}</span></p>
            ))}
          </div>
        ) : null}

        {coDevelopers.length > 0 ? (
          <div className="developer-profile-co-developers">
            <p className="developer-profile-hours-title">Also built with</p>
            {coDevelopers.map((entry) => (
              <p key={entry.name}>{entry.href ? <Link href={entry.href}>{entry.name}</Link> : entry.name}</p>
            ))}
          </div>
        ) : null}
      </aside>

      <div className="developer-profile-main">
        <div className="developer-profile-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "projects"} className={tab === "projects" ? "active" : undefined} onClick={() => setTab("projects")}>Projects</button>
          <button type="button" role="tab" aria-selected={tab === "reviews"} className={tab === "reviews" ? "active" : undefined} onClick={() => setTab("reviews")}>Reviews</button>
          <button type="button" role="tab" aria-selected={tab === "awards"} className={tab === "awards" ? "active" : undefined} onClick={() => setTab("awards")}>Awards</button>
          <button type="button" role="tab" aria-selected={tab === "press"} className={tab === "press" ? "active" : undefined} onClick={() => setTab("press")}>Press mentions</button>
        </div>

        {tab === "projects" ? (
          <section className="developer-profile-communities">
            {locations.length > 1 ? (
              <div className="developer-profile-communities-head developer-profile-communities-head-filter-only">
                <div className="developer-profile-filter">
                  <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} aria-label="Filter by location">
                    <option value="all">All locations ({projects.length})</option>
                    {locations.map((location) => <option key={location} value={location}>{location}</option>)}
                  </select>
                  <ChevronDown size={16} />
                </div>
              </div>
            ) : null}

            {visibleProjects.length === 0 ? (
              <p className="developer-empty-note">No projects listed yet.</p>
            ) : (
              <div className="developer-profile-list">
                {visibleProjects.map((project) => (
                  <Link href={`/projects/${project.slug}`} key={project.slug} className="developer-profile-row">
                    <div className="developer-profile-row-image">
                      {project.heroImage ? <Image src={project.heroImage} alt={project.name} width={150} height={110} /> : <House size={28} />}
                    </div>
                    <div className="developer-profile-row-body">
                      <h3>{project.name}</h3>
                      <p className="developer-profile-row-price">{project.status === "Coming Soon" ? "Register now" : `From ${formatLkr(project.startingPriceLkr)}`}</p>
                      <p className="developer-profile-row-meta">{project.type} | {project.constructionStatus}</p>
                      <p className="developer-profile-row-address">{project.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : tab === "reviews" ? (
          <section className="developer-profile-reviews-tab">
            {reviews.length === 0 ? (
              <p className="developer-empty-note">No reviews yet. Be the first to share your experience with {developer.name}.</p>
            ) : (
              <div className="developer-profile-list-plain">
                {reviews.map((review) => (
                  <div key={review.id} className="developer-review-row">
                    <div className="developer-review-stars" aria-label={`${review.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={14} fill={n <= review.rating ? "#f47b36" : "none"} className={n <= review.rating ? "developer-review-star-filled" : "developer-review-star-empty"} />
                      ))}
                    </div>
                    <p className="developer-review-comment">{review.comment}</p>
                    <p className="developer-profile-award-meta">
                      {review.reviewerName} · {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : tab === "awards" ? (
          <section className="developer-profile-awards">
            {developer.awards && developer.awards.length > 0 ? (
              <div className="developer-profile-list-plain">
                {developer.awards.map((award) => (
                  <div key={award.title} className="developer-profile-award-row">
                    <p className="developer-profile-award-title">{award.title}</p>
                    <p className="developer-profile-award-meta">{[award.issuer, award.year].filter(Boolean).join(" · ")}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="developer-empty-note">No awards listed yet.</p>
            )}
          </section>
        ) : (
          <section className="developer-profile-press">
            {developer.pressMentions && developer.pressMentions.length > 0 ? (
              <div className="developer-profile-list-plain">
                {developer.pressMentions.map((mention) => (
                  <div key={mention.title} className="developer-profile-press-row">
                    {mention.url ? (
                      <a href={mention.url} target="_blank" rel="noopener noreferrer" className="developer-profile-press-title">{mention.title}</a>
                    ) : (
                      <p className="developer-profile-press-title">{mention.title}</p>
                    )}
                    <p className="developer-profile-press-meta">{[mention.source, mention.date].filter(Boolean).join(" · ")}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="developer-empty-note">No press mentions yet.</p>
            )}
          </section>
        )}
      </div>

      <WriteReviewDialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} developer={developer} />
    </div>
  );
}

function WriteReviewDialog({ open, onClose, developer }: { open: boolean; onClose: () => void; developer: Developer }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!open) return null;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rating < 1) {
      setErrorMessage("Please select a star rating.");
      return;
    }
    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developerSlug: developer.slug,
          rating,
          comment,
          reviewerName: name,
          reviewerEmail: email,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErrorMessage(data?.error ?? "Unable to submit your review. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setErrorMessage("Unable to submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    onClose();
    // Reset for next time the dialog opens, after the close animation/tick.
    setTimeout(() => {
      setRating(0);
      setComment("");
      setName("");
      setEmail("");
      setSubmitted(false);
      setErrorMessage("");
    }, 200);
  };

  return (
    <div className="request-info-overlay" role="dialog" aria-modal="true" aria-label="Write a review" onClick={close}>
      <div className="request-info-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="request-info-topbar">
          <p className="request-info-topbar-title">Write a review</p>
          <button type="button" className="request-info-close" aria-label="Close" onClick={close}><X className="h-5 w-5" /></button>
        </div>

        {submitted ? (
          <div className="request-info-success">
            <h2>Thanks for your review</h2>
            <p>It&rsquo;s pending approval and will show on {developer.name}&rsquo;s profile once reviewed.</p>
            <Button type="button" onClick={close}>Close</Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="request-info-body">
            <label className="request-info-field">
              <span>Your rating<span className="request-info-star">*</span></span>
              <div className="write-review-star-picker" role="radiogroup" aria-label="Rating out of 5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <Star size={26} fill={n <= (hoverRating || rating) ? "#f47b36" : "none"} className={n <= (hoverRating || rating) ? "developer-review-star-filled" : "developer-review-star-empty"} />
                  </button>
                ))}
              </div>
            </label>

            <label className="request-info-field">
              <span>Your review<span className="request-info-star">*</span></span>
              <textarea value={comment} onChange={(event) => setComment(event.target.value)} required placeholder={`Share your experience with ${developer.name}`} rows={4} />
            </label>

            <label className="request-info-field">
              <span>Name<span className="request-info-star">*</span></span>
              <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Enter your name" />
            </label>

            <label className="request-info-field">
              <span>Email<span className="request-info-star">*</span></span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="Enter your email" />
            </label>

            {errorMessage ? <p className="request-info-error">{errorMessage}</p> : null}

            <Button type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit review"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
