"use client";


import { useEffect, useState } from 'react'
import styles from "./page.module.scss";
import Hero from '../components/home/hero';
import AboutMe from '../components/home/AboutMe';
import Experience from "@/components/home/Experience";
import Contact from "@/components/home/contact/Contact"
import MyVision from "@/components/home/MyVision"
import Preloader from "@/components/home/Preloader"
import { AnimatePresence } from 'framer-motion';
import Projects from "@/components/home/Projects/Project"
import Slideshow from "@/components/home/SliderSection"
import Header from "@/components/layout/header/header"
import { motion, useScroll } from "motion/react"
  




export default function Home() {
  
  const { scrollYProgress } = useScroll()
  const [isLoading, setIsLoading] = useState(true);

  useEffect( () => {
    (
      async () => {
          

          setTimeout( () => {
            setIsLoading(false);
            document.body.style.cursor = 'default'
            window.scrollTo(0,0);
          }, 2000)
      }
    )()
  }, [])
  return (
    

<div>
<motion.div
                id="scroll-indicator"
                style={{
                    scaleX: scrollYProgress,
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    originX: 0,
                    backgroundColor: "#ff3636",
                    zIndex:50,
                    
                }}
            />
<AnimatePresence
        mode="wait"
        onExitComplete={() => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("mf:preloader-exited"));
          }
        }}
      >
        {isLoading && <Preloader />}
      </AnimatePresence>
      <Header/>
      <div className={styles.heroAboutFlow}>
        <Hero />
        <AboutMe />
      </div>
      <Experience />
      <MyVision/>
      <Projects/>
      <Slideshow/>
    </div>
    
  );
}
