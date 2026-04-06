"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Header.module.scss";
import { supabase } from "@/lib/supabase";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  LOGO_INTRO_DELAY_SEC,
  hasLogoIntroPlayedSession,
  markLogoIntroPlayedSession,
} from "@/constants/preloader-logo";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { when: "beforeChildren", staggerChildren: 0.2 },
  },
};

const navVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const linkVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

// 🌟 GSAP Animated SVG Logo Component
const AnimatedSvgLogo = ({ isScrolled }) => {
  const containerRef = useRef(null);
  const batchRef = useRef(null);
  
  // Two separate refs for the flower to prevent scroll & hover fighting
  const flowerScrollRef = useRef(null); 
  const flowerHoverRef = useRef(null); 

  const [introFinished, setIntroFinished] = useState(false);
  const isHovered = useRef(false);
  const hoverTweens = useRef([]);

  // 1. INTRO ANIMATION (first visit this session: same tweens + delay as Preloader sync; later routes: skip)
  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      if (hasLogoIntroPlayedSession()) {
        const paths = containerRef.current?.querySelectorAll(".animate-path");
        if (paths?.length) {
          gsap.set(paths, { scale: 1, rotation: 0, transformOrigin: "50% 50%" });
        }
        if (batchRef.current) {
          gsap.set(batchRef.current, {
            scale: isScrolled ? 0.8 : 1.35,
            transformOrigin: "50% 50%",
          });
        }
        if (flowerScrollRef.current) {
          gsap.set(flowerScrollRef.current, { scale: 1, transformOrigin: "50% 50%" });
        }
        if (flowerHoverRef.current) {
          gsap.set(flowerHoverRef.current, { transformOrigin: "50% 50%" });
        }
        setIntroFinished(true);
        return;
      }

      const tl = gsap.timeline({
        delay: LOGO_INTRO_DELAY_SEC,
        onComplete: () => {
          markLogoIntroPlayedSession();
          setIntroFinished(true);
        },
      });

      gsap.set(".animate-path", { scale: 0, rotation: -15, transformOrigin: "50% 50%" });
      if (batchRef.current) gsap.set(batchRef.current, { scale: 0, transformOrigin: "50% 50%" });
      if (flowerScrollRef.current) {
        gsap.set(flowerScrollRef.current, { scale: 0, transformOrigin: "50% 50%" });
      }
      if (flowerHoverRef.current) {
        gsap.set(flowerHoverRef.current, { transformOrigin: "50% 50%" });
      }

      tl.to(".animate-path", {
        scale: 1,
        rotation: 0,
        duration: 0.8,
        ease: "back.out(1.5)",
        stagger: 0.1,
      })
        .to(
          batchRef.current,
          {
            scale: 1.35,
            duration: 0.8,
            ease: "back.out(1.5)",
          },
          "<"
        )
        .to(
          flowerScrollRef.current,
          {
            scale: 1,
            duration: 0.8,
            ease: "elastic.out(1, 0.5)",
          },
          "<0.1"
        );
    }, containerRef);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per mount; session flag handles repeat visits
  }, []);

  // 2. SCROLL ANIMATIONS
  useLayoutEffect(() => {
    if (!introFinished) return;

    let ctx = gsap.context(() => {
      // A. SCROLL SCRUB: Flower rotates forward scrolling down, backwards scrolling up
      gsap.to(flowerScrollRef.current, {
        rotation: 1080, // Spins 3 full times down the length of the page
        ease: "none",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5, // 1.5 seconds of smooth catching up
        }
      });
    }, containerRef);
    return () => ctx.revert();
  }, [introFinished]);

  // Separate effect for Batch scale so it triggers on React state change
  useLayoutEffect(() => {
    if (!introFinished) return;
    let ctx = gsap.context(() => {
      if (!isHovered.current) {
        gsap.to(batchRef.current, { 
          scale: isScrolled ? 0.8 : 1.35, 
          duration: 0.5, 
          ease: "power2.out" 
        });
      }
    }, containerRef);
    return () => ctx.revert();
  }, [isScrolled, introFinished]);

  // 3. HOVER INTERACTIONS
  const handleMouseEnter = () => {
    if (!introFinished) return; 
    isHovered.current = true;
    hoverTweens.current.forEach(t => t.kill());
    
    hoverTweens.current = [
      // Scale up logo & bounce batch
      gsap.to(containerRef.current, { scale: 1.08, duration: 0.4, ease: "back.out(1.5)" }),
      gsap.to(batchRef.current, { y: -8, repeat: -1, yoyo: true, duration: 0.3, ease: "sine.inOut" }),
      
      // Fast spin using the INNER flower ref (combines mathematically with outer scroll ref!)
      gsap.to(flowerHoverRef.current, { rotation: "+=360", repeat: -1, duration: 0.4, ease: "none" })
    ];
  };

  const handleMouseLeave = () => {
    if (!introFinished) return;
    isHovered.current = false;
    hoverTweens.current.forEach(t => t.kill());

    // Restore scales
    gsap.to(containerRef.current, { scale: 1, duration: 0.4, ease: "power2.out" });
    gsap.to(batchRef.current, { y: 0, scale: isScrolled ? 0.8 : 1.35, duration: 0.4 });
    
    // Stop fast inner spin smoothly, letting the scroll rotation take over seamlessly
    gsap.to(flowerHoverRef.current, { rotation: 0, duration: 0.5, ease: "power2.out" });
  };

  return (
    <div 
      className={`${styles.logoWrapper} ${isScrolled ? styles.scrolledLogo : ''}`} 
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
        <svg width="100%" height="100%" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <g id="-main-anikap-tech">
                
                <path className="animate-path" id="ani" fill="#000000" stroke="none" d="M 668.796448 411.452942 L 668.796448 269.255188 L 712.593323 269.255188 L 712.593323 411.452942 Z M 690.410461 247.072327 C 683.395325 247.072327 677.47052 244.654968 672.635742 239.82019 C 667.801025 234.985474 665.383667 229.060608 665.383667 222.045471 C 665.383667 215.030396 667.801025 209.152893 672.635742 204.412903 C 677.47052 199.672974 683.395325 197.303101 690.410461 197.303101 C 697.235962 197.303101 703.066101 199.672974 707.900879 204.412903 C 712.735596 209.152893 715.152954 215.030396 715.152954 222.045471 C 715.152954 229.060608 712.735596 234.985474 707.900879 239.82019 C 703.066101 244.654968 697.235962 247.072327 690.410461 247.072327 Z M 540.249573 411.452942 L 496.452728 411.452942 L 496.452728 269.255188 L 537.690063 269.255188 L 540.533997 284.043762 C 544.894714 277.976624 550.914368 273.236694 558.59314 269.823975 C 566.271912 266.411255 574.756287 264.704834 584.04657 264.704834 C 600.920715 264.704834 614.050232 269.871277 623.435303 280.204407 C 632.820374 290.537476 637.512939 304.99408 637.512939 323.574646 L 637.512939 411.452942 L 593.715942 411.452942 L 593.715942 334.097351 C 593.715942 325.186218 591.440857 318.029053 586.890503 312.625427 C 582.340149 307.221863 576.273132 304.520203 568.689148 304.520203 C 559.967651 304.520203 553.047424 307.127075 547.928284 312.341125 C 542.809143 317.555054 540.249573 324.617432 540.249573 333.528503 Z M 378.997314 415.150085 C 364.019073 415.150085 352.122009 411.026367 343.305664 402.778931 C 334.489349 394.531372 330.081268 383.487488 330.081268 369.64679 C 330.081268 356.564514 334.584137 346.13678 343.590088 338.363342 C 352.595978 330.589783 365.630646 326.03949 382.694458 324.71228 L 422.509857 321.583923 L 422.509857 319.308716 C 422.509857 314.568787 421.561859 310.634705 419.665894 307.506409 C 417.769928 304.37793 415.068176 302.008057 411.560638 300.396423 C 408.05307 298.784912 403.644958 297.979065 398.336212 297.979065 C 389.045929 297.979065 381.98349 299.685486 377.148743 303.098206 C 372.313995 306.510925 369.896667 311.44043 369.896667 317.88678 L 333.494019 317.88678 C 333.494019 307.079712 336.243164 297.694763 341.741516 289.731628 C 347.239868 281.768555 355.060638 275.606628 365.204132 271.245911 C 375.347626 266.885132 387.149933 264.704834 400.611359 264.704834 C 414.452026 264.704834 426.159515 267.169556 435.734253 272.099121 C 445.308929 277.028625 452.608368 284.233276 457.632721 293.713135 C 462.657043 303.193115 465.169159 314.758362 465.169159 328.409363 L 465.169159 411.452942 L 426.491394 411.452942 L 423.64743 392.6828 C 421.372253 399.12915 416.016174 404.485229 407.579071 408.75116 C 399.141937 413.017151 389.614807 415.150085 378.997314 415.150085 Z M 394.354675 382.728943 C 402.696991 382.728943 409.52243 380.690796 414.831146 376.614441 C 420.139923 372.538147 422.79422 366.423645 422.79422 358.270996 L 422.79422 350.592224 L 400.611359 352.583069 C 391.13147 353.341431 384.448273 354.905579 380.561493 357.275513 C 376.674744 359.645569 374.731384 363.105713 374.731384 367.656067 C 374.731384 372.775208 376.342957 376.567078 379.566132 379.03186 C 382.789307 381.496643 387.71875 382.728943 394.354675 382.728943 Z"/>
                
                <g id="dot-tech">
                    <path className="animate-path" id="tech" fill="#000000" stroke="none" d="M 680.802063 618.979004 C 683.347961 618.979004 684.852356 621.004028 685.315247 625.054321 L 685.315247 634.77478 C 685.315247 658.266357 685.141663 689.51062 684.794495 728.508728 C 689.076172 724.227051 693.068481 722.086243 696.771545 722.086243 C 706.144958 722.086243 712.220276 732.269531 714.997559 752.636536 C 715.344788 767.796082 716.212708 780.930237 717.601318 792.03949 C 717.601318 794.006714 715.749817 795.800415 712.046753 797.420532 C 708.112183 795.453308 706.144958 793.312439 706.144958 790.998047 L 706.839294 790.477295 L 706.839294 789.782959 C 705.103516 754.835083 703.251892 737.36145 701.284729 737.36145 C 699.895996 734.584106 698.623108 732.963989 697.465942 732.50116 L 695.730042 732.50116 C 689.944031 737.592896 687.051025 743.783875 687.051025 751.074341 L 687.398193 788.394287 C 686.009521 791.750244 684.215881 793.428162 682.017151 793.428162 C 678.198364 793.428162 675.76825 788.105042 674.726746 777.458679 C 675.536804 770.399658 675.941772 764.324402 675.941772 759.232666 L 675.941772 758.711914 L 675.594666 758.191162 L 675.941772 757.67041 L 675.941772 753.330933 L 676.983276 674.004272 C 675.594666 661.043457 674.90033 648.31427 674.90033 635.816284 L 674.90033 625.401489 C 675.131775 621.119751 677.098999 618.979004 680.802063 618.979004 Z M 646.085815 718.614624 C 648.978882 718.614624 650.425354 722.028381 650.425354 728.855957 L 651.987549 743.610352 C 651.987549 746.156189 650.020386 747.834106 646.085815 748.644165 C 643.655701 748.644165 640.53125 743.378967 636.712463 732.848267 L 636.191711 732.153931 L 634.976624 732.153931 C 630.463501 732.153931 627.917664 738.576416 627.33905 751.421448 L 627.33905 754.025208 C 627.33905 767.101746 631.562805 774.797119 640.010498 777.111511 L 643.308533 777.111511 C 646.895935 777.111511 652.334717 773.92926 659.625183 767.564575 L 660.840271 767.564575 L 660.840271 767.217407 C 664.427612 768.258911 666.221252 770.283936 666.221252 773.292725 C 663.675415 777.92157 658.236572 782.087524 649.904663 785.790588 L 641.572754 787.873535 C 630.694885 787.873535 622.88385 779.541748 618.139282 762.877869 L 617.097778 753.504456 L 617.097778 752.462952 C 617.097778 734.757568 622.420837 724.516418 633.067261 721.739075 L 634.629456 721.739075 L 640.010498 722.259827 C 641.630615 719.829712 643.655701 718.614624 646.085815 718.614624 Z M 578.909851 725.037109 C 585.390259 725.037109 589.787659 730.880981 592.102051 742.568848 C 589.093262 755.645386 582.902283 762.183533 573.52887 762.183533 L 572.834534 762.183533 L 572.834534 762.704285 C 574.686096 773.234924 579.604187 778.500183 587.588928 778.500183 C 593.722168 778.500183 598.69812 773.234924 602.516968 762.704285 L 606.335693 761.142029 C 608.881592 761.142029 610.501709 763.109253 611.196045 767.043823 C 611.196045 774.218506 605.583618 780.988159 594.358582 787.352783 L 586.026733 788.915039 C 576.074646 788.915039 568.610718 781.798279 563.634705 767.564575 C 562.246094 761.894165 561.551758 757.20752 561.551758 753.504456 L 561.551758 751.247925 C 561.551758 739.444336 566.469788 730.881104 576.306152 725.557861 Z M 572.487366 746.908386 L 572.487366 747.255554 L 576.306152 751.247925 C 578.041992 751.247925 579.662048 748.875671 581.166443 744.131042 L 581.166443 741.35376 C 580.58783 737.766418 579.835632 735.972717 578.909851 735.972717 L 577.868347 735.972717 C 576.132568 735.972717 574.338928 739.61792 572.487366 746.908386 Z M 534.2995 635.642761 C 538.002563 635.642761 539.65155 646.780823 539.246521 669.05719 C 538.841553 691.333557 538.639038 707.100342 538.639038 716.358032 L 538.986145 716.358032 L 549.401062 714.795837 C 552.756958 715.258728 554.434875 716.936646 554.434875 719.829712 C 554.434875 723.764221 550.789795 725.731445 543.499268 725.731445 L 538.986145 727.293701 L 540.548401 785.44342 C 540.08551 789.37793 538.29187 791.345154 535.167358 791.345154 C 531.464294 791.345154 529.612793 788.625793 529.612793 783.18689 L 529.612793 769.473938 L 529.265625 730.76532 L 528.571289 729.02948 L 520.933716 729.550232 C 517.693542 728.855957 516.073425 727.062256 516.073425 724.169189 C 516.073425 720.581848 520.065796 718.788208 528.050537 718.788208 L 528.050537 718.093872 C 528.050537 703.281494 528.281982 677.418213 528.744873 640.503052 C 528.744873 637.609985 530.596375 635.98999 534.2995 635.642761 Z"/>
                    
                    {/* WRAPPED FLOWER FOR COMBINED SCROLL/HOVER */}
                    <g ref={flowerScrollRef}>
                        <path ref={flowerHoverRef} id="Flower-tech" fill="#ea3e3e" fillOpacity="0.962838" stroke="none" d="M 446.150482 736.563538 C 450.611542 708.485352 434.40329 708.485352 438.867737 736.563538 C 426.070831 708.485352 418.079193 711.797913 428.885803 740.697388 C 412.190216 717.68689 400.729309 729.137573 423.73645 745.836548 C 394.836914 735.029907 391.524384 743.021606 419.602539 755.818481 C 391.524384 751.354004 391.524384 767.562317 419.602539 763.0979 C 391.524384 775.894775 394.836914 783.886475 423.73645 773.079773 C 400.729309 789.778809 412.190216 801.239807 428.885803 778.229248 C 418.079193 807.128784 426.070831 810.441284 438.867737 782.363037 C 434.40329 810.441284 450.611542 810.441284 446.150482 782.363037 C 458.94397 810.441284 466.939056 807.128784 456.129028 778.229248 C 472.828003 801.239807 484.289032 789.778809 461.278473 773.079773 C 490.181305 783.886475 493.490509 775.894775 465.412292 763.0979 C 493.490509 767.562317 493.490509 751.354004 465.412292 755.818481 C 493.490509 743.021606 490.181305 735.029907 461.278473 745.836548 C 484.289032 729.137573 472.834808 717.68689 456.135834 740.697388 C 466.935638 711.797913 458.94397 708.485352 446.150482 736.563538 Z"/>
                    </g>
                </g>

                <g ref={batchRef} id="andon-batch">
                    <path id="Rounded-Rectangle" fill="#6b63f7" fillOpacity="0.962838" fillRule="evenodd" stroke="none" d="M 477.220306 464.818176 C 481.450317 478.155518 495.691467 485.538513 509.028839 481.308533 L 717.850525 415.080017 C 731.187927 410.849976 738.570923 396.608826 734.340942 383.271484 L 720.82489 340.654785 C 716.59491 327.317444 702.35376 319.934448 689.016357 324.164429 L 480.194672 390.392944 C 466.8573 394.622925 459.474304 408.864136 463.704285 422.201477 Z"/>
                    <path id="andon" fill="#ffffff" stroke="none" d="M 665.299805 403.137695 L 658.390564 405.328979 L 649.487976 377.258789 L 655.885803 375.229675 L 657.612793 378.702942 C 658.046082 377.006653 658.935791 375.510376 660.281921 374.214111 C 661.628052 372.917847 663.257568 371.96637 665.170654 371.359619 C 668.690063 370.243408 671.675781 370.435669 674.127869 371.936401 C 676.580017 373.437073 678.380249 375.998047 679.528748 379.619324 L 685.005554 396.887939 L 678.096313 399.079224 L 673.135071 383.436218 C 672.397339 381.110046 671.306763 379.534912 669.863342 378.710632 C 668.419861 377.886414 666.798462 377.759644 664.999084 378.330322 C 662.847534 379.012695 661.379395 380.226624 660.594666 381.972229 C 659.809875 383.717773 659.779114 385.730835 660.502441 388.011414 Z M 617.923279 402.672485 C 616.995728 399.747925 616.826782 396.970703 617.416443 394.34082 C 618.006104 391.710938 619.23822 389.410828 621.112854 387.44043 C 622.987488 385.470032 625.371704 384.02594 628.265503 383.108154 C 631.171143 382.186646 633.948242 381.993774 636.596924 382.529602 C 639.245544 383.06543 641.568665 384.237976 643.566223 386.047302 C 645.563782 387.856689 647.026306 390.223633 647.953857 393.148193 C 648.877808 396.061523 649.043823 398.829407 648.451843 401.451904 C 647.859863 404.074402 646.635986 406.367859 644.780334 408.332214 C 642.924561 410.29657 640.543945 411.739502 637.638306 412.661072 C 634.744507 413.578857 631.963867 413.772827 629.296265 413.243042 C 626.628662 412.713257 624.297302 411.547363 622.302063 409.745422 C 620.306824 407.94342 618.84729 405.585815 617.923279 402.672485 Z M 624.876648 400.423218 C 625.416199 402.12439 626.236206 403.513367 627.33667 404.590393 C 628.437195 405.667358 629.70343 406.373657 631.13562 406.70929 C 632.567749 407.044983 634.079285 406.96051 635.670349 406.455933 C 637.261353 405.951294 638.545471 405.149109 639.522644 404.049316 C 640.499878 402.949524 641.120972 401.644653 641.385986 400.134583 C 641.651001 398.624512 641.513733 397.018982 640.974243 395.31781 C 640.431335 393.606079 639.619446 392.218994 638.538574 391.156677 C 637.457703 390.094299 636.20105 389.395203 634.768555 389.059326 C 633.335999 388.723511 631.824219 388.807861 630.233215 389.312439 C 628.642212 389.817078 627.358276 390.619324 626.38147 391.71936 C 625.404663 392.819336 624.773926 394.117004 624.489319 395.612427 C 624.204651 397.107849 624.333801 398.711487 624.876648 400.423218 Z M 600.539063 424.46875 C 602.677917 423.792847 604.46051 422.729309 605.889648 421.279663 C 607.318726 419.830078 608.198792 418.174988 608.529785 416.314392 L 610.359375 420.5625 L 616.757813 418.53125 L 603.34375 376.234375 L 596.429688 378.421875 L 602.085938 396.257813 C 600.760254 395.12262 599.164124 394.424805 597.299072 394.16394 C 595.43396 393.903015 593.514771 394.08551 591.541382 394.711365 C 588.730408 395.602905 586.511169 397.01239 584.883484 398.939941 C 583.255859 400.867493 582.253662 403.130188 581.877014 405.728088 C 581.500305 408.325928 581.776306 411.088867 582.704956 414.017029 C 583.625366 416.919128 584.973022 419.298706 586.747986 421.155884 C 588.522949 423.013 590.589355 424.244202 592.947327 424.849365 L 600.541748 424.470337 C 597.836792 425.328247 595.305298 425.45459 592.947327 424.849365 Z M 591.9375 415.710938 C 590.90686 414.622925 590.126465 413.243652 589.595581 411.569763 C 589.064514 409.895264 588.908142 408.320862 589.126526 406.846436 C 589.344849 405.37207 589.922424 404.080933 590.859314 402.973083 C 591.796143 401.865234 593.065735 401.057251 594.667969 400.549072 C 596.282104 400.03717 597.795776 399.955139 599.208923 400.302979 C 600.622131 400.650879 601.856018 401.360107 602.910522 402.430847 C 603.965027 403.501526 604.762085 404.887451 605.301575 406.588562 C 605.832458 408.262451 605.978577 409.85022 605.739868 411.351929 C 605.501221 412.853638 604.903809 414.151184 603.947693 415.244568 C 602.991638 416.338013 601.706543 417.140686 600.092407 417.652588 L 595.585938 417.875 C 594.182983 417.514648 592.966797 416.792297 591.9375 415.710938 Z M 562.351563 435.789063 L 557.554688 420.664063 C 556.832581 418.380676 556.863342 416.367615 557.648132 414.62207 C 558.432861 412.876465 559.901001 411.662537 562.052551 410.980164 C 563.851929 410.409485 565.473328 410.536255 566.916809 411.360474 C 568.360229 412.184753 569.450806 413.759888 570.188599 416.08606 L 575.148438 431.726563 L 582.0625 429.539063 L 576.585938 412.265625 C 575.433716 408.647888 573.633484 406.086975 571.181335 404.586243 C 568.729248 403.08551 565.74353 402.89325 562.224121 404.00946 C 560.311096 404.616211 558.681519 405.567688 557.335388 406.863953 C 555.989258 408.160217 555.099548 409.656494 554.66626 411.352844 L 552.9375 407.882813 L 546.539063 409.90625 L 555.445313 437.976563 Z M 533.492188 445.734375 C 535.684204 445.040161 537.499207 443.970398 538.939819 442.525269 C 540.380432 441.080139 541.170715 439.532837 541.31073 437.883301 L 543.179688 441.867188 L 549.21875 439.953125 L 543.820313 422.914063 C 542.989563 420.303406 541.801941 418.27124 540.255615 416.820679 C 538.70929 415.370178 536.890015 414.487976 534.797729 414.174072 C 532.705383 413.860168 530.395874 414.103882 527.86908 414.905273 C 525.349915 415.704224 523.267639 416.819031 521.62207 418.249634 C 519.976563 419.680298 518.874695 421.312744 518.316406 423.147095 C 517.758179 424.981384 517.803406 426.921326 518.452209 428.966919 L 524.328125 427.101563 C 523.850098 425.59967 524.033936 424.266663 524.878723 423.104614 C 525.723511 421.942627 527.176331 421.03479 529.237366 420.381165 C 530.411682 420.008728 531.483215 419.867859 532.452026 419.958618 C 533.420898 420.049377 534.270264 420.410583 535.000183 421.042236 C 535.730164 421.673889 536.297546 422.628052 536.702454 423.904785 L 536.898438 424.53125 L 528.726563 427.84375 C 525.471191 429.171631 523.184631 430.891235 521.868652 433.005615 C 520.552673 435.119995 520.303711 437.466858 521.121826 440.046387 C 521.955688 442.675598 523.483765 444.516418 525.706055 445.568848 L 533.494751 445.734558 C 530.524597 446.676514 527.928406 446.621277 525.706055 445.568848 Z M 530.21875 439.976563 C 529.180237 439.613037 528.460083 438.794922 528.056274 437.521729 C 527.695862 436.385254 527.861877 435.324707 528.554382 434.339905 C 529.246948 433.355164 530.643433 432.43396 532.743958 431.576233 L 538.429688 429.21875 L 538.914063 430.742188 C 539.591919 432.879822 539.490051 434.753723 538.607422 436.361267 C 537.724792 437.968811 536.217224 439.110779 534.084595 439.787109 L 530.216858 439.976074 C 531.253479 440.339111 532.542725 440.276184 534.084595 439.787109 Z"/>
                </g>

                <path className="animate-path" id="kap" fill="#000000" stroke="none" d="M 574.453735 655.56189 L 574.453735 445.109253 L 615.691101 445.109253 L 617.966248 462.457275 C 621.947876 455.821411 628.109741 450.512695 636.452026 446.531189 C 644.794312 442.549622 653.989685 440.558838 664.038391 440.558838 C 677.310242 440.558838 688.970337 443.49762 699.018982 449.375122 C 709.067688 455.252625 716.935913 463.642212 722.62384 474.544128 C 728.311768 485.446045 731.155701 498.5755 731.155701 513.932922 C 731.155701 528.911133 728.548767 542.230225 723.3349 553.890503 C 718.120972 565.550781 710.537048 574.69873 700.583252 581.334717 C 690.629333 587.970642 678.542603 591.288574 664.322754 591.288574 C 654.463684 591.288574 645.363098 589.582153 637.020813 586.169434 C 628.678467 582.756592 622.421875 578.395996 618.250671 573.087219 L 618.250671 655.56189 Z M 618.535095 516.20813 C 618.535095 523.223206 620.004456 529.432495 622.943237 534.835999 C 625.881958 540.239563 629.958313 544.410645 635.172241 547.349365 C 640.386169 550.288208 646.405823 551.757568 653.231384 551.757568 C 660.24646 551.757568 666.266113 550.240784 671.290466 547.207153 C 676.314819 544.173706 680.201477 540.002563 682.950684 534.693848 C 685.699829 529.385071 687.074463 523.223206 687.074463 516.20813 C 687.074463 509.192963 685.699829 503.031097 682.950684 497.722412 C 680.201477 492.413605 676.314819 488.242554 671.290466 485.208923 C 666.266113 482.175415 660.24646 480.658691 653.231384 480.658691 C 646.405823 480.658691 640.386169 482.128052 635.172241 485.066772 C 629.958313 488.005493 625.881958 492.129272 622.943237 497.437958 C 620.004456 502.746704 618.535095 509.003357 618.535095 516.20813 Z M 456.998383 591.00415 C 442.020172 591.00415 430.123047 586.880432 421.306763 578.632935 C 412.490479 570.385437 408.082367 559.341431 408.082367 545.500854 C 408.082367 532.418579 412.585236 521.990845 421.591156 514.217285 C 430.597046 506.443817 443.631714 501.893494 460.695526 500.566345 L 500.510895 497.437958 L 500.510895 495.162842 C 500.510895 490.422852 499.562927 486.48877 497.666962 483.360413 C 495.770966 480.231995 493.069244 477.862122 489.561676 476.250549 C 486.054138 474.638916 481.646027 473.83313 476.33728 473.83313 C 467.046997 473.83313 459.984589 475.539551 455.14978 478.952271 C 450.315094 482.365051 447.897736 487.294495 447.897736 493.740845 L 411.495087 493.740845 C 411.495087 482.933777 414.244232 473.548767 419.742554 465.585693 C 425.240906 457.622559 433.061707 451.460693 443.2052 447.099976 C 453.348694 442.739197 465.151031 440.558838 478.612457 440.558838 C 492.453125 440.558838 504.160583 443.023621 513.735291 447.953125 C 523.309998 452.88269 530.609436 460.087341 535.633728 469.5672 C 540.658081 479.047119 543.170227 490.612427 543.170227 504.263458 L 543.170227 587.307007 L 504.492462 587.307007 L 501.648499 568.536865 C 499.373352 574.983215 494.017273 580.339233 485.580139 584.605225 C 477.143005 588.871216 467.615845 591.00415 456.998383 591.00415 Z M 472.355774 558.583008 C 480.69809 558.583008 487.523499 556.544861 492.832245 552.468506 C 498.140991 548.392151 500.795349 542.27771 500.795349 534.125 L 500.795349 526.44635 L 478.612457 528.437134 C 469.132538 529.195435 462.449341 530.759644 458.562561 533.129639 C 454.675812 535.499573 452.732452 538.959717 452.732452 543.510071 C 452.732452 548.629211 454.344025 552.421143 457.5672 554.885864 C 460.790344 557.350708 465.719788 558.583008 472.355774 558.583008 Z M 300.865234 587.307007 L 257.068298 587.307007 L 257.068298 304.319458 L 300.865234 304.319458 L 300.865234 496.300415 L 346.937317 445.109253 L 401.825623 445.109253 L 348.359314 501.419525 L 400.119263 587.307007 L 349.496857 587.307007 L 317.644562 534.125 L 300.865234 551.757568 Z"/>
            </g>
        </svg>
    </div>
  );
};

// 🌟 Interactive Contact Button with Roll-out Circles & Proximity Eyes
// ... (The rest of the file remains exactly identical as requested)

// 🌟 Interactive Contact Button with Roll-out Circles & Proximity Eyes
const InteractiveContactButton = () => {
  const eyeLeftRef = useRef(null);
  const eyeRightRef = useRef(null);
  const pupilLeftRef = useRef(null);
  const pupilRightRef = useRef(null);
  const buttonRef = useRef(null);
  const eyesWrapperRef = useRef(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    let ctx = gsap.context(() => {
      if (isNear) {
        gsap.to(eyesWrapperRef.current, { 
          width: 52, 
          scale: 1, 
          opacity: 1, 
          marginLeft: 8, 
          duration: 0.4, 
          ease: "back.out(1.2)" 
        });
      } else {
        gsap.to(eyesWrapperRef.current, { 
          width: 0, 
          scale: 0.5, 
          opacity: 0, 
          marginLeft: 0, 
          duration: 0.3, 
          ease: "power2.out" 
        });
      }
    });
    return () => ctx.revert();
  }, [isNear]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        setIsNear(dist < 300);
      }

      const updateEye = (eyeRef, pupilRef) => {
        if (!eyeRef.current || !pupilRef.current) return;
        const eye = eyeRef.current.getBoundingClientRect();
        if (eye.width === 0) return;

        const eyeCenterX = eye.left + eye.width / 2;
        const eyeCenterY = eye.top + eye.height / 2;
        const deltaX = e.clientX - eyeCenterX;
        const deltaY = e.clientY - eyeCenterY;
        const angle = Math.atan2(deltaY, deltaX);

        const maxRadius = eye.width / 2 - pupilRef.current.offsetWidth / 2 - 1.5;
        const distance = Math.min(maxRadius, Math.hypot(deltaX, deltaY) / 12);

        const pupilX = distance * Math.cos(angle);
        const pupilY = distance * Math.sin(angle);

        gsap.to(pupilRef.current, { x: pupilX, y: pupilY, duration: 0.1 });
      };

      updateEye(eyeLeftRef, pupilLeftRef);
      updateEye(eyeRightRef, pupilRightRef);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const circleVariants = {
    rest: { rotate: -270, opacity: 0 },
    hover: { rotate: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <motion.div
      className={styles.contactWrapper}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial="rest"
      animate={isHovered ? "hover" : "rest"}
    >
      <motion.div
        className={styles.socialCircles}
        variants={{
          rest: { width: 0, opacity: 0, marginRight: 0 },
          hover: { width: "auto", opacity: 1, marginRight: 12 },
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.a 
          variants={circleVariants}
          href="https://www.linkedin.com/in/anirudha-kapileshwari-293826202/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.socialCircle}
        >
          <img src="/3.png" alt="LinkedIn" className={styles.socialIcon} />
        </motion.a>
        <motion.a 
          variants={circleVariants}
          href="https://github.com/andoniit" 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.socialCircle}
        >
          <img src="/2.png" alt="GitHub" className={styles.socialIcon} />
        </motion.a>
        <motion.a 
          variants={circleVariants}
          href="https://www.behance.net/aniruddkapiles1" 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.socialCircle}
        >
          <img src="/1.png" alt="Behance" className={styles.socialIcon} />
        </motion.a>
      </motion.div>

      <a 
        ref={buttonRef} 
        href="mailto:anikap1999@gmail.com" 
        className={styles.contactButton}
      >
        <span className={styles.contactText}>Get in touch</span>
        
        <div ref={eyesWrapperRef} className={styles.eyesWrapper} style={{ width: 0, scale: 0.5, opacity: 0, marginLeft: 0, overflow: 'hidden' }}>
          <div ref={eyeLeftRef} className={styles.eye}><div ref={pupilLeftRef} className={styles.pupil} /></div>
          <div ref={eyeRightRef} className={styles.eye}><div ref={pupilRightRef} className={styles.pupil} /></div>
        </div>
      </a>
    </motion.div>
  );
};

// 🌟 Smooth Framer-Motion Hamburger Icon
const HamburgerIcon = ({ isOpen }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <motion.path
      stroke="#ededed"
      strokeWidth="2"
      strokeLinecap="round"
      animate={isOpen ? { d: "M 6 18 L 18 6" } : { d: "M 4 8 L 20 8" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    />
    <motion.path
      stroke="#ededed"
      strokeWidth="2"
      strokeLinecap="round"
      animate={isOpen ? { d: "M 6 6 L 18 18" } : { d: "M 4 16 L 20 16" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    />
  </svg>
);

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(null);
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setIsAdminLoggedIn(!!data.session);
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setIsAdminLoggedIn(!!session);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/resume");
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && typeof data.url === "string" && data.url) {
          setResumeUrl(data.url);
        }
      } catch {
        if (!cancelled) setResumeUrl(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const NavItems = ({ isMobile }) => (
    <>
      <motion.div variants={linkVariants} className={isMobile ? styles.mobileNavItem : ""}>
        <InteractiveContactButton />
      </motion.div>

      {resumeUrl && (
        <motion.div className={`${styles.resumeWrapper} ${isMobile ? styles.mobileNavItem : ""}`} variants={linkVariants}>
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.resumeButtonPill}
          >
            <span className={styles.buttonContent}>View My Resume</span>
          </a>
          {!isMobile && (
            <div className={styles.resumeTooltip}>
              <div className={styles.iframeWrapper}>
                <iframe 
                  src={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} 
                  className={styles.resumePreview}
                  title="Resume Preview"
                />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {isAdminLoggedIn && (
        <motion.div variants={linkVariants} className={isMobile ? styles.mobileNavItem : ""}>
          <Link href="/admin" className={styles.dashboardButtonPill}>
            Dashboard
          </Link>
        </motion.div>
      )}
    </>
  );

  return (
    <motion.header className={styles.header} variants={containerVariants}>
      <div className={styles.container}>
        
        {/* Logo */}
        <Link href="/" className={styles.logoLink}>
          <AnimatedSvgLogo isScrolled={isScrolled} />
        </Link>
        
        {/* Desktop Navigation */}
        <motion.nav className={styles.desktopNav} variants={navVariants}>
          <NavItems isMobile={false} />
        </motion.nav>

        {/* Mobile Hamburger Toggle Button */}
        <button 
          className={styles.mobileToggleBtn}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          <HamburgerIcon isOpen={isMobileMenuOpen} />
        </button>
      </div>

      {/* 📱 Mobile Sliding Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className={styles.mobileDropdown}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className={styles.mobileDropdownContent}>
              <NavItems isMobile={true} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}