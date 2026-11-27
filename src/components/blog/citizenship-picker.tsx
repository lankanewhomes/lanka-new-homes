"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./citizenship-picker.module.css";

// "Which route are you?" for the dual citizenship article (owner, 2026-11-27: more engaging articles, a picker on the citizenship post).
// Two taps, then a result card. Every fact is from the Department of Immigration and Emigration and the London / Canberra High Commission
// pages the article is built on (read 2026-11-26); nothing here is legal advice and the card says to confirm with the Department.

type RouteId = "resume" | "retain";
type CategoryId = "age" | "qualification" | "property" | "deposit" | "family";

const ROUTES: { id: RouteId; label: string; hint: string; title: string; documents: string[] }[] = [
  {
    id: "resume",
    label: "I already hold another country's citizenship",
    hint: "My Sri Lankan citizenship ended and I want it back",
    title: "Resume your Sri Lankan citizenship",
    documents: ["Your foreign citizenship certificate", "Your foreign passport"],
  },
  {
    id: "retain",
    label: "I am Sri Lankan and about to take another citizenship",
    hint: "I want to keep my Sri Lankan citizenship",
    title: "Retain your Sri Lankan citizenship",
    documents: ["Your current Sri Lankan passport", "Your permanent residence visa"],
  },
];

const CATEGORIES: { id: CategoryId; label: string; title: string; documents: string[]; note?: string }[] = [
  { id: "age", label: "I am 55 or older", title: "Age: you have completed 55 years", documents: ["Your birth certificate"] },
  {
    id: "qualification",
    label: "I have a diploma, a degree or a professional qualification",
    title: "Qualifications: a diploma of at least one year, a degree or a professional qualification",
    documents: ["Your certificates"],
  },
  {
    id: "property",
    label: "I own, or will buy, property in Sri Lanka worth Rs. 2.5 million or more",
    title: "Property: land or a home in Sri Lanka worth Rs. 2.5 million or more",
    documents: ["The original deed in your name", "A valuation report and a title report, each issued within the last three months"],
    note: "A gifted property counts only if the gift deed is at least 10 years old. A home you buy yourself has no such wait.",
  },
  {
    id: "deposit",
    label: "I can hold a deposit or Treasury bonds for three years",
    title: "Deposit: Rs. 2.5 million in an approved bank, or USD 25,000 in an NRFC, RFC or SFIDA account or in Treasury bonds",
    documents: ["A letter from the bank confirming the money stays for three years"],
  },
  {
    id: "family",
    label: "I am the spouse or child of an applicant",
    title: "Family: the spouse or unmarried child of an applicant",
    documents: ["Your marriage certificate (spouse) or birth certificate (child)"],
    note: "Children must apply before they turn 21.",
  },
];

export function CitizenshipPicker() {
  const [route, setRoute] = useState<RouteId | null>(null);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const r = ROUTES.find((x) => x.id === route);
  const c = CATEGORIES.find((x) => x.id === category);

  return (
    <div className={styles.picker}>
      <p className={styles.step}>
        <span className={styles.num}>1</span> Where do you stand?
      </p>
      <div className={styles.options} role="group" aria-label="Where do you stand?">
        {ROUTES.map((opt) => (
          <button key={opt.id} type="button" className={styles.option} aria-pressed={route === opt.id} onClick={() => setRoute(opt.id)}>
            <span className={styles.optionLabel}>{opt.label}</span>
            <span className={styles.optionHint}>{opt.hint}</span>
          </button>
        ))}
      </div>

      <p className={styles.step}>
        <span className={styles.num}>2</span> What can you show?
      </p>
      <div className={styles.options} role="group" aria-label="What can you show?">
        {CATEGORIES.map((opt) => (
          <button key={opt.id} type="button" className={styles.option} aria-pressed={category === opt.id} onClick={() => setCategory(opt.id)}>
            <span className={styles.optionLabel}>{opt.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.result} role="status" aria-live="polite">
        {r && c ? (
          <>
            <p className={styles.resultKicker}>Your route</p>
            <p className={styles.resultTitle}>{r.title}</p>
            <p className={styles.resultKicker}>Your category</p>
            <p className={styles.resultText}>{c.title}</p>
            <p className={styles.resultKicker}>Prepare</p>
            <ul className={styles.resultList}>
              {[...r.documents, ...c.documents, "A police clearance certificate if you are over 16"].map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            {c.note ? <p className={styles.resultNote}>{c.note}</p> : null}
            <p className={styles.resultNote}>Fee: USD 2,000 for the main applicant, USD 500 for a spouse and for each child, paid only after approval. Each family member applies separately.</p>
            {c.id === "property" ? (
              <p className={styles.resultLinks}>
                <Link href="/projects">Browse new homes</Link>
                <Link href="/land">Browse land</Link>
              </p>
            ) : null}
            <p className={styles.resultNote}>Confirm the current rules with the Department of Immigration and Emigration or your nearest Sri Lankan mission before you apply.</p>
            <button type="button" className={styles.reset} onClick={() => { setRoute(null); setCategory(null); }}>
              Start again
            </button>
          </>
        ) : (
          <p className={styles.placeholder}>Pick one answer in each step to see your route.</p>
        )}
      </div>
    </div>
  );
}
