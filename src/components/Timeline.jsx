"use client";

import { useEffect } from "react";
import Framer from "@/components/Framer";

const Timeline = () => {
  useEffect(() => {
    const timelines = document.querySelectorAll(".timeline__right");
    const trackers = document.querySelectorAll(".timeline__tracker");

    const onScroll = () => {
      timelines.forEach((timeline, i) => {
        const content = timeline.querySelector(".timeline__content");
        if (trackers[i].offsetTop > 0) {
          content.classList.add("animate-on-scroll");
        } else {
          content.classList.remove("animate-on-scroll");
        }
        timeline.style.background = `linear-gradient(180deg, #ff3636 0%, #ff3636 0%, #ff3636 ${
          trackers[i].offsetTop + 5
        }px, black ${trackers[i].offsetTop + 5}px, black 100%)`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div>
      <div style={{ height: "30vh" }}></div>
      
      <div className="timeline">
      
      <div style={{fontSize:"4em", fontFamily:"var(--font-shadows)"}}>
      <Framer>
        <h1>Expirience</h1>
        </Framer>
      </div>
      
        <div className="timeline__section">
          
          <div className="timeline__left">
            
            <div className="timeline__date">
              <div>Lorem ipsum</div>
              <div>March 1st, 2022</div>
            </div>
          </div>
          <div className="timeline__tracker">
            <div className="tracker"></div>
          </div>
          <div className="timeline__middle">
            <div className="timeline__bullet"></div>
          </div>
          <div className="timeline__right">
            <div>
              <div className="timeline__content">
                Yes, Yes, without the oops! You're a very talented young man, with
                your own clever thoughts and ideas. Do you need a manager? Did he just
                throw my cat 
              </div>
            </div>
          </div>
        </div>

        <div className="timeline__section">
          <div className="timeline__left">
            <div className="timeline__date">
              <div>Lorem ipsum</div>
              <div>MARCH 1ST, 2022</div>
            </div>
          </div>
          <div className="timeline__tracker">
            <div className="tracker"></div>
          </div>
          <div className="timeline__middle">
            <div className="timeline__bullet"></div>
          </div>
          <div className="timeline__right">
            <div>
              <div className="timeline__content">
                Yes, Yes, without the oops! You're a very talented young man, with
                your own clever thoughts and ideas. Do you need a manager? Did he just
                throw my cat out of the window? Eventually, you do plan to have dinosaurs
                on your dinosaur tour, right? Remind me to thank John for a lovely weekend.
              </div>
            </div>
          </div>
        </div>
        <div className="timeline__section">
          <div className="timeline__left">
            <div className="timeline__date">
              <div>Lorem ipsum</div>
              <div>MARCH 1ST, 2022</div>
            </div>
          </div>
          <div className="timeline__tracker">
            <div className="tracker"></div>
          </div>
          <div className="timeline__middle">
            <div className="timeline__bullet"></div>
          </div>
          <div className="timeline__right">
            <div>
              <div className="timeline__content">
                Yes, Yes, without the oops! You're a very talented young man, with
                your own clever thoughts and ideas. Do you need a manager? Did he just
                throw my cat out of the window? Eventually, you do plan to have dinosaurs
                on your dinosaur tour, right? Remind me to thank John for a lovely weekend.
              </div>
            </div>
          </div>
        </div>
        <div className="timeline__section">
          <div className="timeline__left">
            <div className="timeline__date">
              <div>Lorem ipsum</div>
              <div>MARCH 1ST, 2022</div>
            </div>
          </div>
          <div className="timeline__tracker">
            <div className="tracker"></div>
          </div>
          <div className="timeline__middle">
            <div className="timeline__bullet"></div>
          </div>
          <div className="timeline__right">
            <div>
              <div className="timeline__content">
                Yes, Yes, without the oops! You're a very talented young man, with
                your own clever thoughts and ideas. Do you need a manager? Did he just
                throw my cat out of the window? Eventually, you do plan to have dinosaurs
                on your dinosaur tour, right? Remind me to thank John for a lovely weekend.
              </div>
            </div>
          </div>
        </div>
        <div className="timeline__section">
          <div className="timeline__left">
            <div className="timeline__date">
              <div>Lorem ipsum</div>
              <div>MARCH 1ST, 2022</div>
            </div>
          </div>
          <div className="timeline__tracker">
            <div className="tracker"></div>
          </div>
          <div className="timeline__middle">
            <div className="timeline__bullet"></div>
          </div>
          <div className="timeline__right">
            <div>
              <div className="timeline__content">
                Yes, Yes, without the oops! You're a very talented young man, with
                your own clever thoughts and ideas. Do you need a manager? Did he just
                throw my cat out of the window? Eventually, you do plan to have dinosaurs
                on your dinosaur tour, right? Remind me to thank John for a lovely weekend.
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Global Styles */}
      <style jsx global>{`
        :root {
          /* Inverted colors: background is white and text is black */
          --color-black: white;
          --color-white: black;
          --color-grey: #494949;
          --sticky-top-pos: 30vh;
          --buffer: 5rem;
        }
        html,
        body {
          margin: 0;
          padding: 0;
          background-color: var(--color-black);
          color: var(--color-white);
        }
      `}</style>

      {/* Component-Specific Styles */}
      <style jsx>{`
        .timeline {
          max-width: 1000px;
          margin: 0 auto;
        }
        .timeline__section {
          display: grid;
          grid-template-columns: auto 5px 50px auto;
          align-items: start;
          position: relative;
        }
        .timeline__left {
          font-size: 1.5rem;
          text-align: right;
          text-transform: uppercase;
          color:rgb(63, 63, 63); 
          font-family: 'Tajawal';

        }
        .timeline__left,
        .timeline__middle,
        .timeline__tracker {
          position: sticky;
          top: var(--sticky-top-pos);
        }
        .timeline__left,
        .timeline__middle {
          margin-bottom: var(--buffer);
        }
        .timeline__right {
          background: linear-gradient(
            180deg,
            red 0%,
            red 0%,
            var(--color-grey) 0%,
            var(--color-grey) 100%
          );
        }
        .timeline__right > div {
          background-color: var(--color-black);
          padding-bottom: var(--buffer);
          padding-left: 45px;
          margin-left: 4px;
        }
        .timeline__date > div:first-child {
          font-size: 1rem;
        }
        .timeline__bullet {
          --bullet-dims: 20px;
          background-color: var(--color-white);
          width: var(--bullet-dims);
          height: var(--bullet-dims);
          border-radius: 50%;
          transform: translateX(calc(var(--bullet-dims) / 2 + 2px));
          float: right;
        }
        .timeline__content {
          font-size: 1.5rem;
          color: var(--color-grey);
          transition: color 1s cubic-bezier(0, 0.39, 0.58, 1);
    font-family: 'Tajawal';

        }
        .animate-on-scroll {
          color: var(--color-white);
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .timeline__section {
            grid-template-columns: 1fr;
            grid-gap: 1rem;
            margin-bottom: var(--buffer);
          }
          .timeline__left,
          .timeline__middle,
          .timeline__tracker,
          .timeline__right {
            position: static;
            text-align: left;
          }
          .timeline__date {
            text-align: left;
            margin-bottom: 1rem;
          }
          .timeline__bullet {
            transform: none;
            margin: 0 auto;
            display: block;
          }
          .timeline__right > div {
            padding-left: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default Timeline;