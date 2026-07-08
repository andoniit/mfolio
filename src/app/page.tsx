"use client";

import { Suspense, useLayoutEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.scss";
import Hero from '../components/home/hero';
import AboutMe from '../components/home/AboutMe';
import Experience from "@/components/home/Experience";
import VoluntaryRoles from "@/components/home/VoluntaryRoles";
import Contact from "@/components/home/contact/Contact"
import MyVision from "@/components/home/MyVision"
import Preloader from "@/components/home/Preloader"
import { AnimatePresence, motion } from 'framer-motion';
import Projects from "@/components/home/Projects/Project"
import EmojiKeypad from "@/components/home/Projects/EmojiKeypad"
import PolaroidSection from "@/components/home/PolaroidSection"
import MySetups from "@/components/home/MySetups"
import Recommendations from "@/components/home/Recommendations"
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
      <PolaroidSection />
      <Experience />
      {/* Emoji keypad — fills the white space right of the timeline's tail */}
      <div className={styles.keypadAside} aria-label="Interactive emoji keypad">
        <motion.div
          initial={{ opacity: 0, y: 70, rotate: -4 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <EmojiKeypad />
        </motion.div>
      </div>
      <VoluntaryRoles />
      <MyVision/>
      <Projects/>
      <MySetups />
      <Recommendations />
      <Slideshow/>
    </main>
    
  );
}
