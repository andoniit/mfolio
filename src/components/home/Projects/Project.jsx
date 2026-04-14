'use client';
import styles from './combined.module.scss'
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProjectGrid from '@/components/projects/ProjectGrid';
import AnimatedIntroText from '../AnimatedIntroText';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/projects?featured=home&limit=3', {
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
          <ProjectGrid projects={projects} columns={3} />
          <div className={styles.buttonContainer}>
            <Link href="/projects" style={{ textDecoration: 'none' }}>
              <div className={styles.button2}>View More Projects</div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
