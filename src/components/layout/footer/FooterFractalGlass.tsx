"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { vertexShader, fragmentShader } from "./fractalGlassShaders";
import styles from "./FooterFractalGlass.module.scss";

const config = {
  lerpFactor: 0.035,
  parallaxStrength: 0.1,
  distortionMultiplier: 10,
  glassStrength: 1.55,
  glassSmoothness: 0.0001,
  stripesFrequency: 35,
  edgePadding: 0.1,
};

const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

type Props = {
  /** Same asset as footer `::before` so the shader matches the photo layer. */
  textureSrc?: string;
};

export default function FooterFractalGlass({
  textureSrc = "/images/mysetup.jpg",
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const container = mountRef.current;
    const imageElement = imgRef.current;
    if (!container || !imageElement) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const mouse = { x: 0.5, y: 0.5 };
    const targetMouse = { x: 0.5, y: 0.5 };

    const textureSize = { x: 1, y: 1 };
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uResolution: {
          value: new THREE.Vector2(container.clientWidth, container.clientHeight),
        },
        uTextureSize: {
          value: new THREE.Vector2(textureSize.x, textureSize.y),
        },
        uMouse: { value: new THREE.Vector2(mouse.x, mouse.y) },
        uParallaxStrength: { value: config.parallaxStrength },
        uDistortionMultiplier: { value: config.distortionMultiplier },
        uGlassStrength: { value: config.glassStrength },
        ustripesFrequency: { value: config.stripesFrequency },
        uglassSmoothness: { value: config.glassSmoothness },
        uEdgePadding: { value: config.edgePadding },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let texture: THREE.Texture | null = null;
    let raf = 0;
    let disposed = false;

    const resize = () => {
      if (!container || disposed) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      renderer.setSize(w, h, false);
      material.uniforms.uResolution.value.set(w, h);
    };

    const onWinMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const x = THREE.MathUtils.clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const y = THREE.MathUtils.clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1);
      targetMouse.x = x;
      targetMouse.y = y;
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(container);
    resize();
    window.addEventListener("mousemove", onWinMove, { passive: true });
    window.addEventListener("resize", resize, { passive: true });

    const loadImageFromElement = () => {
      if (!imageElement.complete) {
        imageElement.onload = loadImageFromElement;
        return;
      }
      if (disposed) return;

      texture = new THREE.Texture(imageElement);
      texture.needsUpdate = true;
      if (THREE.SRGBColorSpace) {
        texture.colorSpace = THREE.SRGBColorSpace;
      }
      textureSize.x = imageElement.naturalWidth || imageElement.width || 1;
      textureSize.y = imageElement.naturalHeight || imageElement.height || 1;
      material.uniforms.uTexture.value = texture;
      material.uniforms.uTextureSize.value.set(textureSize.x, textureSize.y);
    };

    if (imageElement.complete) {
      loadImageFromElement();
    } else {
      imageElement.onload = loadImageFromElement;
    }

    const animate = () => {
      if (disposed) return;
      raf = requestAnimationFrame(animate);
      mouse.x = lerp(mouse.x, targetMouse.x, config.lerpFactor);
      mouse.y = lerp(mouse.y, targetMouse.y, config.lerpFactor);
      material.uniforms.uMouse.value.set(mouse.x, mouse.y);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onWinMove);
      window.removeEventListener("resize", resize);
      imageElement.onload = null;
      geometry.dispose();
      material.dispose();
      if (texture) texture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [textureSrc]);

  return (
    <div ref={mountRef} className={styles.fractalGlassMount} aria-hidden="true">
      <img
        ref={imgRef}
        src={textureSrc}
        alt=""
        className={styles.hiddenTexture}
        crossOrigin="anonymous"
        decoding="async"
      />
    </div>
  );
}
