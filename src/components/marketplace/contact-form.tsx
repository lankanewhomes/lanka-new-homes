"use client";

import { FormEvent, useState } from "react";

/** The /contact page's own general-inquiry form, posting to /api/contact
 * (a plain email, not a Payload lead — see that route's own comment). */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!response.ok) throw new Error("failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong sending your message — please email support@lankanewhomes.com directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="contact-form-sent" role="status">
        <p>Thanks, {name.split(" ")[0] || "there"} — your message is on its way. We usually reply within one business day.</p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <label className="contact-form-field">
        <span>Name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Your name" autoComplete="name" />
      </label>
      <label className="contact-form-field">
        <span>Email</span>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" autoComplete="email" />
      </label>
      <label className="contact-form-field">
        <span>Message</span>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} required rows={5} placeholder="How can we help?" />
      </label>
      {error ? <p className="contact-form-error">{error}</p> : null}
      <button type="submit" className="contact-form-submit" disabled={submitting}>{submitting ? "Sending…" : "Send message"}</button>
    </form>
  );
}
