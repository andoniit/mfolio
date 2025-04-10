"use client";


import { useEffect, useState } from 'react'
import Hero from './hero';
import InteractiveSection from './InteractiveSection';
import  Timeline  from "@/components/Timeline";
import Contact from "@/components/contact/Contact"
import Scattertext from "@/components/Scattertext"
import Preloader from "@/components/Preloader"
import { AnimatePresence } from 'framer-motion';
import Projects from "@/components/Projects/Project"

import Header from "@/components/header/header"
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
<AnimatePresence mode='wait'>
        {isLoading && <Preloader />}
      </AnimatePresence>
      <Header/>
      <Hero />
      <InteractiveSection />
      <Timeline/>
      <Scattertext/>
      <Projects/>
      <Contact/>
    </div>
    
  );
}
