"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import styles from "./DroneScene.module.scss";

/**
 * Interactive Three.js drone for the Hero landing overlay.
 *
 * Self-contained: spins up its own renderer/scene inside a ref'd div, loads
 * `/public/drone.glb`, keeps the four `Propeller_*` nodes spinning, and lets the
 * model tilt toward the cursor with a drag-to-rotate gesture. Everything is torn
 * down on unmount so it never leaks across route changes.
 */
export default function DroneScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // --- Renderer ---------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // --- Scene & camera ---------------------------------------------------
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 1.4, 7);
    camera.lookAt(0, 0, 0);

    // Drawing-buffer size is synced every frame against the live container size,
    // so it self-heals regardless of when the element actually gets laid out.
    let lastW = 0;
    let lastH = 0;
    const syncSize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0 || (w === lastW && h === lastH)) return;
      lastW = w;
      lastH = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    // --- Lighting ---------------------------------------------------------
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa0b5, 1.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xc8b6ff, 1.4);
    rimLight.position.set(-5, 2, -4);
    scene.add(rimLight);

    // --- Pivot that we tilt/spin -----------------------------------------
    const pivot = new THREE.Group();
    scene.add(pivot);

    const propellers: THREE.Object3D[] = [];

    // --- Interaction state ------------------------------------------------
    const pointer = { x: 0, y: 0 }; // normalized -1..1, target tilt
    let userRotY = 0; // extra yaw from drag
    let dragging = false;
    let lastDragX = 0;
    let raf = 0;

    const loader = new GLTFLoader();
    loader.load(
      "/drone.glb",
      (gltf) => {
        const model = gltf.scene;
        pivot.add(model);

        // Scale to a consistent size first.
        const size0 = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
        const maxDim = Math.max(size0.x, size0.y, size0.z) || 1;
        const targetSize = 4.2;
        model.scale.setScalar(targetSize / maxDim);

        // Recenter using the post-scale bounds so the true center is at the origin.
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // Collect the propeller nodes so we can spin them every frame.
        model.traverse((obj) => {
          if (obj.name.startsWith("Propeller")) propellers.push(obj);
        });

        // Frame the camera off the bounding SPHERE (rotation-invariant) so the
        // drone never clips the canvas edges however it tilts, spins, or bobs.
        const radius = box.getSize(new THREE.Vector3()).length() / 2;
        const fov = THREE.MathUtils.degToRad(camera.fov);
        const dist = (radius / Math.sin(fov / 2)) * 1.18; // extra margin for the hover bob
        camera.position.set(0, radius * 0.18, dist);
        camera.near = Math.max(0.1, dist - radius * 2);
        camera.far = dist + radius * 2;
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
      },
      undefined,
      (err) => {
        // Loading failure shouldn't break the page — just log it.
        console.error("DroneScene: failed to load /drone.glb", err);
      }
    );

    // --- Pointer handlers (whole window so it tracks across the hero) -----
    const onPointerMove = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      if (dragging) {
        userRotY += (e.clientX - lastDragX) * 0.01;
        lastDragX = e.clientX;
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastDragX = e.clientX;
    };
    const onPointerUp = () => {
      dragging = false;
    };

    window.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);

    // --- Animation loop ---------------------------------------------------
    const clock = new THREE.Clock();
    const animate = () => {
      syncSize();
      const dt = clock.getDelta();
      const t = clock.elapsedTime;

      // Spin the blades fast.
      for (const p of propellers) p.rotation.y += dt * 28;

      // Gentle hover bob.
      pivot.position.y = Math.sin(t * 1.4) * 0.12;

      // Ease tilt toward the pointer, plus drag yaw and a slow idle drift.
      const targetRotY = pointer.x * 0.6 + userRotY + t * 0.15;
      const targetRotX = pointer.y * 0.35;
      pivot.rotation.y += (targetRotY - pivot.rotation.y) * 0.06;
      pivot.rotation.x += (targetRotX - pivot.rotation.x) * 0.06;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    // --- Cleanup ----------------------------------------------------------
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) (mat as THREE.Material).dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className={styles.droneCanvas} aria-hidden="true" />;
}
