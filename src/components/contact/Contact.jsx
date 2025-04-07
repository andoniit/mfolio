"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { disperse } from "./anim"; // Ensure you have defined your Framer Motion variants in anim.js
import gsap from "gsap";
import styles from "./contact.module.css";

export default function Contact() {
  const background = useRef(null);

  const setBackground = (isActive) => {
    gsap.to(background.current, { opacity: isActive ? 0.8 : 0 });
  };

  return (
    <main className={styles.main}>
      <div className={styles.body}>
        <div className={styles.introLine}>
          <p>Contact </p>
          
          <p> </p>
        </div>

        <div className={styles.introLine}>
          <p>Anirudha</p>
          <p></p>
        </div>

        <div className={styles.introLine}>
          <p>Kapileshwari</p>
          <p> </p>
        </div>

        <TextDisperse setBackground={setBackground}>
          <p>+13126622927</p>
        </TextDisperse>

        <TextDisperse setBackground={setBackground}>
          <p>→Email</p>
        </TextDisperse>

        <TextDisperse setBackground={setBackground}>
          <p>→Likedin</p>
        </TextDisperse>
        <TextDisperse setBackground={setBackground}>
          <p>→behance</p>
          
          
          
        </TextDisperse>
        
      </div>
      <div ref={background} className={styles.background}></div>
    </main>
  );
}

function TextDisperse({ children, setBackground }) {
  const [isAnimated, setIsAnimated] = useState(false);

  const getChars = () => {
    let chars = [];
    // If children is an array, iterate over it. Otherwise, handle a single child.
    if (Array.isArray(children)) {
      children.forEach((el, i) => {
        chars.push(splitWord(el.props.children, i));
      });
    } else {
      chars.push(splitWord(children.props.children, 1));
    }
    return chars;
  };

  const splitWord = (word, indexOfWord) => {
    let chars = [];
    word.split("").forEach((char, i) => {
      chars.push(
        <motion.span
          custom={indexOfWord * i}
          variants={disperse}
          animate={isAnimated ? "open" : "closed"}
          key={char + i}
        >
          {char}
        </motion.span>
      );
    });
    return chars;
  };

  const manageMouseEnter = () => {
    setBackground(true);
    setIsAnimated(true);
  };
  const manageMouseLeave = () => {
    setBackground(false);
    setIsAnimated(false);
  };

  return (
    <div
      style={{ cursor: "pointer" }}
      onMouseEnter={manageMouseEnter}
      onMouseLeave={manageMouseLeave}
      className={styles.introLine}
    >
      {getChars()}
    </div>
  );
}