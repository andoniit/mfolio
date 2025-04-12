"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { disperse } from "./anim"; // Ensure you have defined your Framer Motion variants in anim.js
import gsap from "gsap";
import styles from "./contact.module.css";
import Framer from "@/components/Framer"



export default function Contact() {
  const background = useRef(null);

  const setBackground = (isActive) => {
    gsap.to(background.current, { opacity: isActive ? 0.5 : 0 });
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

        <div className={styles.contactEmailLine}>
          <p>
          Let's have a conversation about how I can contribute to your success <a href="mailto:akapileshwari@hawk.iit.edu" className={styles.emailLink}>akapileshwari@hawk.iit.edu</a>
          </p>
        </div>
        
          <motion.a
            href="https://drive.google.com/file/d/1MGd6Ju9cMte9KP1prnWCZjEfG1oHuMh_/view?usp=sharing"
            target="_blank"
            className={styles.resumeButton}
          >
            View My Resume
          </motion.a>
        
      </div>
      <div ref={background} className={styles.background}></div>
      <div className={styles.socialIcons}>
  <Framer>
    <motion.a
      href="https://www.linkedin.com/in/anirudha-kapileshwari-293826202/"
      
      target="_blank"
    >
      <img
        className={styles.icon}
        src="/2.png"
        alt="LinkedIn Icon"
      />
      
    </motion.a>
  </Framer>
  <Framer>
    <motion.a
      href="https://github.com/andoniit"
      target="_blank"
      
    >
      <img
        className={styles.icon}
        src="/3.png"
        alt="GitHub Icon"
      />
      
    </motion.a>
  </Framer>
  <Framer>
    <motion.a
      href="https://www.behance.net/aniruddkapiles1"
      
      target="_blank"
    >
      <img
        className={styles.icon}
        src="/1.png"
        alt="Behance Icon"
      />
      
    </motion.a>
  </Framer>
</div>
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