"use client";

import Image from "next/image";
import { useEffect, useState } from 'react'
import Hero from './hero';
import InteractiveSection from './InteractiveSection';
import  Timeline  from "@/components/Timeline";
import Contact from "@/components/contact/Contact"
import Scattertext from "@/components/Scattertext"
import Preloader from "@/components/Preloader"
import { AnimatePresence } from 'framer-motion';
import Projects from "@/components/Project"

import Header from "@/components/header/header"

  




export default function Home() {
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
<AnimatePresence mode='wait'>
        {isLoading && <Preloader />}
      </AnimatePresence>
      <Header/>
<Hero />

<InteractiveSection />
<Scattertext/>

<Timeline/>

<Projects/>

<Contact/>
    </div>
    
  );
}
