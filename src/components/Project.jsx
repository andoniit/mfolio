"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./combined.module.scss";
import Picture from '../../public/images/2.jpg';
import Image from "next/image";
import Picture7 from '../../public/images/7.jpg';
import Framer from "@/components/Framer";



const anim = {
  initial: { width: 0 },
  open: {
    width: "auto",
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
  },
  closed: { width: 0 },
};

export function Project({ project }) {
  const [isActive, setIsActive] = useState(false);
  const { title1, title2, src } = project;

  return (
    <div
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      className={styles.project}
    >
      <p className={styles.title}>{title1}</p>
      <motion.div
        variants={anim}
        animate={isActive ? "open" : "closed"}
        className={styles.imgContainer}
      >
        <Image src={src} alt={title1} />
      </motion.div>
      <p className={styles.title}>{title2}</p>
    </div>
  );
}

export default function Homee() {
  const projects = [
    {
      title1: "Jomor",
      title2: "Design",
      src: Picture7,
    },
    {
      title1: "La",
      title2: "Grange",
      src: Picture7,
      
    },
    {
      title1: "Deux Huit",
      title2: "Huit",
      src: Picture7,
      
    },
    {
      title1: "Nothing",
      title2: "Design Studio",
      src: Picture7,
      
    },
    {
      title1: "Mambo",
      title2: "Mambo",
      src: Picture7,
      
    },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.gallery}>
        <Framer>
        <p>Featured Work</p>
        </Framer>
        {projects.map((project, i) => (
          <Project key={i} project={project} />
        ))}
      </div>
    </main>
  );
}