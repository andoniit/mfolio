"use client";

import { useState } from "react";
import styles from "./SiteFooter.module.scss";

export default function NewsletterSubscribeForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [variant, setVariant] = useState<"success" | "error" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setVariant(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setVariant("error");
      setMessage("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setVariant("error");
        setMessage(
          typeof data.message === "string"
            ? data.message
            : "Something went wrong. Please try again."
        );
        return;
      }

      if (data.ok && typeof data.message === "string") {
        setVariant("success");
        setMessage(data.message);
        if (data.code === "subscribed" || data.code === "reactivated") {
          setEmail("");
        }
      } else {
        setVariant("error");
        setMessage("Something went wrong. Please try again.");
      }
    } catch {
      setVariant("error");
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.newsletterForm} onSubmit={handleSubmit} noValidate>
      <div className={styles.newsletterFormFields}>
        <div className={styles.inputWrapper}>
          <input
            required
            className={styles.inputField}
            id="newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            aria-invalid={variant === "error"}
            aria-describedby={message ? "newsletter-feedback" : undefined}
          />
          <label className={styles.inputLabel} htmlFor="newsletter-email">
            Email Address
          </label>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "…" : "Submit"}
        </button>
      </div>

      {message && (
        <p
          id="newsletter-feedback"
          role="status"
          className={
            variant === "success"
              ? styles.newsletterMessageSuccess
              : styles.newsletterMessageError
          }
        >
          {message}
        </p>
      )}
    </form>
  );
}
