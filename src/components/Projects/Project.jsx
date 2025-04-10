'use client';
import styles from './combined.module.scss'
import { useState } from 'react';
import Project from '../Projects/components/project';
import Modal from '../Projects/components/modal';
import Framer from "@/components/Framer"




const projects = [
  
  {
    title: "CycleConnect",
    description: "Wild Hacks 2025 Submession Project ",
    src: "9.png",
    color: "#123456",
    link: "https://github.com/andoniit/WildHacks2025"
  },
  {
    title: "Ar.Deepa",
    description: "Architectural Portfolio website built with React Motion and Three.js components.",
    src: "8.png",
    color: "#654321",
    link: "https://ardeepa.com"
  },
  {
    title: "Enterprise Web Application",
    description: "Enterprise web application utilizing ChatGPT APIs, Docker, and Elasticsearch.",
    src: "11.png",
    color: "#abcdef",
    link: "https://github.com/andoniit/Enterprise_web_application"
  },
  {
    title: "Threejs Web Portfolio",
    description: "My old portfolio built with Three.js.",
    src: "10.png",
    color: "#fedcba",
    link: "https://my-potfolio-fzxhbd9le-anikap1999-gmailcom.vercel.app/"
  },
  {
    title: "Agile Academy",
    description: "Online course registration application.",
    src: "12.png",
    color: "#0f0f0f",
    link: "https://agilityacademy.com.au/"
  },
  {
    title: "ColorDreams",
    description: "Photography Portfolio",
    src: "13.png",
    color: "pink",
    link: "https://colordreams.in"
  }
]

export default function Home() {

  const [modal, setModal] = useState({active: false, index: 0})

  return (
    <>
    <div className={styles.featuredTitle}>
      Featured Projects
    </div>
  <div className={styles.mainp}>
    
    <div className={styles.bodyp}>
    
      {
        projects.map( (project, index) => {
          return <Project index={index} title={project.title} description={project.description} setModal={setModal} link={project.link} key={index}/>
        })
      }
      <div className={styles.buttonContainer}>
      <Framer>
      <a 
      href="https://github.com/andoniit" 
      target="_blank" 
      rel="noopener noreferrer"
      style={{ textDecoration: 'none' }} /* optional, to remove underline */
    >
  <div className={styles.button2}>More Projects on GitHub</div>
  </a>
  </Framer>
</div>
      

    </div>
    <Modal modal={modal} projects={projects}/>
  </div>
  </>
  )
}
