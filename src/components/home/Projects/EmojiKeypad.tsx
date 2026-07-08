"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import styles from "./EmojiKeypad.module.scss";

/**
 * Interactive Three.js emoji keypad (public/emoji_keypad.glb).
 *
 * - Tilts gently toward the cursor.
 * - Each `Key_*` is clickable: the key presses down and an emoji pops out.
 * - Lives in the white space between the Experience timeline and Voluntary
 *   Roles (right-aligned; see page.tsx).
 */

const KEY_EMOJI: Record<string, string> = {
  Key_Heart: "❤️",
  Key_Smile: "😊",
  Key_Kiss: "😘",
  Key_HeartEyes: "😍",
};

export default function EmojiKeypad() {
  const mountRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const overlay = overlayRef.current;
    if (!mount || !overlay) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);

    // Box-fit the keypad: width against the horizontal FOV, height against the
    // vertical. (A bounding-sphere fit left this wide, flat model tiny on
    // screen — keys became ~40px targets.)
    let frameHalf = new THREE.Vector3(2, 1, 1);
    const frameCamera = () => {
      const vfov = THREE.MathUtils.degToRad(camera.fov);
      const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
      const dist =
        Math.max(frameHalf.x / Math.tan(hfov / 2), frameHalf.y / Math.tan(vfov / 2)) * 1.22 +
        frameHalf.z;
      camera.position.set(0, dist * 0.45, dist * 0.9);
      const reach = frameHalf.length();
      camera.near = Math.max(0.1, dist - reach * 3);
      camera.far = dist + reach * 3;
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };

    let lastW = 0;
    let lastH = 0;
    const syncSize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0 || (w === lastW && h === lastH)) return;
      lastW = w;
      lastH = h;
      camera.aspect = w / h;
      frameCamera();
      renderer.setSize(w, h);
    };

    scene.add(new THREE.HemisphereLight(0xffffff, 0xb9bdcc, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(3, 6, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdcd9ff, 0.9);
    fill.position.set(-4, 2, -3);
    scene.add(fill);

    const pivot = new THREE.Group();
    scene.add(pivot);

    // --- State ------------------------------------------------------------
    const pointer = { x: 0, y: 0 };
    let raf = 0;
    const keys: THREE.Object3D[] = [];
    const keyRestY = new Map<THREE.Object3D, number>();
    const pressT = new Map<THREE.Object3D, number>(); // seconds remaining pressed

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    // The keypad GLB is Draco-compressed; decoder files live in /public/draco.
    const draco = new DRACOLoader();
    draco.setDecoderPath("/draco/");
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    loader.load(
      "/emoji_keypad.glb",
      (gltf) => {
        const model = gltf.scene;
        pivot.add(model);

        // Scale + center on the origin — framed on the keypad BODY only (base +
        // keys). Including the trailing cable inflated the bounds and shrank
        // the keypad (tiny click targets); the cable may trail off-canvas.
        model.updateWorldMatrix(true, true);
        const bodyParts: THREE.Object3D[] = [];
        model.traverse((o) => {
          if (o.name === "Keypad_Base" || o.name.startsWith("Key_")) bodyParts.push(o);
        });
        const bodyBox = () => {
          const b = new THREE.Box3();
          for (const p of bodyParts) b.expandByObject(p);
          return b;
        };
        const size = bodyBox().getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        model.scale.setScalar(4.6 / maxDim);
        model.updateWorldMatrix(true, true);
        model.position.sub(bodyBox().getCenter(new THREE.Vector3()));
        model.updateWorldMatrix(true, true);

        frameHalf = bodyBox().getSize(new THREE.Vector3()).multiplyScalar(0.5);
        frameCamera();

        const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
        model.traverse((o) => {
          if (o.name.startsWith("Key_")) {
            keys.push(o);
            keyRestY.set(o, o.position.y);
            // Oversized invisible hit-target so near-misses still press the key.
            const g = (o as THREE.Mesh).geometry;
            if (g) {
              g.computeBoundingBox();
              const bb = g.boundingBox!;
              const s = bb.getSize(new THREE.Vector3());
              const hit = new THREE.Mesh(
                new THREE.BoxGeometry(s.x * 1.35, s.y * 3, s.z * 1.6),
                hitMat
              );
              hit.position.copy(bb.getCenter(new THREE.Vector3()));
              o.add(hit);
            }
          }
        });
      },
      undefined,
      (err) => console.error("EmojiKeypad: failed to load /emoji_keypad.glb", err)
    );

    // --- Emoji pop overlay --------------------------------------------------
    const popEmoji = (emoji: string, clientX: number, clientY: number) => {
      const rect = mount.getBoundingClientRect();
      const el = document.createElement("span");
      el.className = styles.emojiPop;
      el.textContent = emoji;
      el.style.left = `${clientX - rect.left}px`;
      el.style.top = `${clientY - rect.top}px`;
      overlay.appendChild(el);
      window.setTimeout(() => el.remove(), 950);
    };

    // --- Pointer handlers (tap = press key) --------------------------------
    const onPointerMove = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    };

    let downX = 0;
    let downY = 0;
    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const onPointerUp = (e: PointerEvent) => {
      // A tap = finger/cursor barely moved between down and up. (No time limit:
      // slow deliberate presses should still count.)
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (moved > 14) return;
      const rect = mount.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(ndc, camera);
      // Raycast the whole model so we hit exactly what's visible, then walk up
      // to the key node (if the hit was the base/cable, do nothing).
      const hits = raycaster.intersectObjects(pivot.children, true);
      if (hits.length === 0) return;
      let node: THREE.Object3D | null = hits[0].object;
      while (node && !node.name.startsWith("Key_")) node = node.parent;
      if (!node) return;
      pressT.set(node, 0.22);
      popEmoji(KEY_EMOJI[node.name] ?? "✨", e.clientX, e.clientY);
    };

    window.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerdown", onPointerDown);
    mount.addEventListener("pointerup", onPointerUp);

    // --- Animation loop -----------------------------------------------------
    const clock = new THREE.Clock();
    const animate = () => {
      syncSize();
      const dt = Math.min(clock.getDelta(), 0.05);

      // Gentle tilt toward the cursor.
      const targetRotY = pointer.x * 0.35;
      const targetRotX = pointer.y * 0.18;
      pivot.rotation.y += (targetRotY - pivot.rotation.y) * 0.08;
      pivot.rotation.x += (targetRotX - pivot.rotation.x) * 0.08;

      // Key presses: dip while timer runs, spring back after.
      for (const k of keys) {
        const rest = keyRestY.get(k) ?? 0;
        const t = pressT.get(k) ?? 0;
        if (t > 0) pressT.set(k, t - dt);
        const target = t > 0 ? rest - 0.28 : rest;
        k.position.y += (target - k.position.y) * 0.35;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerdown", onPointerDown);
      mount.removeEventListener("pointerup", onPointerUp);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const m = mesh.material;
        if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
        else if (m) (m as THREE.Material).dispose();
      });
      renderer.dispose();
      draco.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className={styles.keypadWrap}>
      <div ref={mountRef} className={styles.canvasMount} aria-label="Interactive emoji keypad" />
      <div ref={overlayRef} className={styles.emojiOverlay} aria-hidden="true" />
    </div>
  );
}
