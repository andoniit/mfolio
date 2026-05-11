"use client";

import { Suspense, useLayoutEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.scss";
import Hero from '../components/home/hero';
import AboutMe from '../components/home/AboutMe';
import Experience from "@/components/home/Experience";
import Contact from "@/components/home/contact/Contact"
import MyVision from "@/components/home/MyVision"
import Preloader from "@/components/home/Preloader"
import { AnimatePresence } from 'framer-motion';
import Projects from "@/components/home/Projects/Project"
import MySetups from "@/components/home/MySetups"
import Slideshow from "@/components/home/SliderSection"
import Header from "@/components/layout/header/header"

/**
 * `useSearchParams` needs Suspense. When `mfEmbed=1` (copilot iframe), never mount
 * Preloader — mounting then instantly unmounting left a fixed full-viewport shell
 * mid–exit animation (“half stuck”).
 */
function PreloaderGate() {
  const searchParams = useSearchParams();
  const skipIntro = searchParams.get("mfEmbed") === "1";
  const [introDone, setIntroDone] = useState(skipIntro);

  useLayoutEffect(() => {
    if (skipIntro) {
      setIntroDone(true);
      return;
    }
    const t = window.setTimeout(() => {
      setIntroDone(true);
      document.body.style.cursor = "default";
      window.scrollTo(0, 0);
    }, 2000);
    return () => window.clearTimeout(t);
  }, [skipIntro]);

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mf:preloader-exited"));
        }
      }}
    >
      {!introDone && <Preloader />}
    </AnimatePresence>
  );
}

export default function Home() {
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const homePageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Anirudha Kapileshwari - Portfolio",
    url: siteBase ? `${siteBase}/` : "/",
    description:
      "Portfolio homepage showcasing software projects, experience, writing, and creative setups by Anirudha Kapileshwari.",
    inLanguage: "en",
  };

  return (
    

<main>
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageJsonLd) }}
/>
<Suspense fallback={null}>
        <PreloaderGate />
      </Suspense>
      <Header/>
      <div className={styles.heroAboutFlow}>
        <Hero />
        <AboutMe />
      </div>
      <Experience />
      <MyVision/>
      <Projects/>
      <MySetups />
      <Slideshow/>
    </main>
    
  );
}
