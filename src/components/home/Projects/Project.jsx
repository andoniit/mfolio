'use client';
import styles from './combined.module.scss'
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import CopilotProjectGridBridge from '@/components/projects/CopilotProjectGridBridge';
import AnimatedIntroText from '../AnimatedIntroText';

const EASE = [0.16, 1, 0.3, 1];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/projects?featured=home&limit=4', {
          cache: 'no-store',
        });
        const data = await res.json().catch(() => []);

        if (!cancelled && res.ok && Array.isArray(data)) {
          setProjects(data);
          // Trigger a scroll event so floating nav re-evaluates the newly mounted section
          setTimeout(() => window.dispatchEvent(new CustomEvent('scroll')), 100);
        }
      } catch {
        if (!cancelled) {
          setProjects([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || projects.length === 0) {
    return null;
  }

  return (
    <section id="featured-projects" aria-label="Featured projects" style={{ paddingTop: '2.5rem', marginTop: '1rem' }}>
      <h2 className={styles.featuredTitle}>
        <AnimatedIntroText text={["Featured Projects"]} />
      </h2>
      <div className={styles.mainp}>
        <div className={styles.bodyp}>
          <CopilotProjectGridBridge projects={projects} columns={4} />

          <motion.div
            className={styles.buttonContainer}
            initial={{ opacity: 0, scale: 0.85, y: 18 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.9 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <Link href="/projects" style={{ textDecoration: 'none' }}>
              <div className={styles.button2}>View More Projects</div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
