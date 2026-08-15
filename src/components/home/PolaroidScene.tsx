"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import styles from "./PolaroidScene.module.scss";

/**
 * Interactive Three.js Polaroid camera.
 *
 * - The camera body tilts toward the cursor.
 * - Clicking the camera asks for webcam access (browser permission prompt),
 *   grabs a single frame, applies it to the photo, and ejects the Polaroid out
 *   of the slot. Clicking again retakes the shot.
 *
 * Loads `/public/polaroid.glb`. All resources are disposed on unmount.
 */

// How far the photo is tucked up inside the body before a shot, and how far it
// slides down past the slot once ejected (in model-local units, pre-scale).
// The photo slides FORWARD out of the front slot (lying flat, image up). This is
// how far it travels: it starts tucked back inside and slides to its authored
// resting spot (sticking out the front, as modeled).
const EJECT_TRAVEL = 0.95;
const EJECT_DURATION = 1.6; // seconds

/** Loads the brand logo once and caches it for the download composition. */
let logoImg: HTMLImageElement | null = null;
let logoPromise: Promise<HTMLImageElement | null> | null = null;
function loadLogo(): Promise<HTMLImageElement | null> {
  if (logoImg) return Promise.resolve(logoImg);
  if (!logoPromise) {
    logoPromise = new Promise((resolve) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => {
        logoImg = im;
        resolve(im);
      };
      im.onerror = () => resolve(null);
      im.src = "/logo/anikap.svg";
    });
  }
  return logoPromise;
}

/** Builds a classic Polaroid-framed PNG (white border, taller bottom) from a
 *  square source canvas. The bottom caption shows the date with the brand logo
 *  on the right. Returns a data URL. */
async function composePolaroid(src: HTMLCanvasElement): Promise<string> {
  const side = 56;
  const img = 620;
  const top = 56;
  const bottom = 168; // taller bottom lip, like a real Polaroid
  const out = document.createElement("canvas");
  out.width = side * 2 + img;
  out.height = top + img + bottom;
  const ctx = out.getContext("2d")!;

  // Paper.
  ctx.fillStyle = "#fbfbf6";
  ctx.fillRect(0, 0, out.width, out.height);

  // Thin dark frame, then the photo.
  ctx.fillStyle = "#141414";
  ctx.fillRect(side - 3, top - 3, img + 6, img + 6);
  ctx.drawImage(src, side, top, img, img);

  // Caption row: date on the left, brand logo on the right.
  const capY = top + img + bottom / 2;
  const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const logo = await loadLogo();

  if (logo) {
    const lh = 92;
    const lw = lh * (logo.width / logo.height || 1.03);
    const lx = out.width - side - lw;
    ctx.drawImage(logo, lx, capY - lh / 2, lw, lh);

    ctx.fillStyle = "#444";
    ctx.textAlign = "right";
    ctx.font = "italic 30px Georgia, 'Times New Roman', serif";
    ctx.fillText(date, lx - 26, capY + 10);
  } else {
    // Fallback if the logo can't load: centered date only.
    ctx.fillStyle = "#444";
    ctx.textAlign = "center";
    ctx.font = "italic 30px Georgia, 'Times New Roman', serif";
    ctx.fillText(date, out.width / 2, capY + 10);
  }

  return out.toDataURL("image/png");
}

export interface PolaroidSceneProps {
  /**
   * Called each time a photo is taken with the Polaroid-framed PNG data URL
   * (for preview/download) and the bare square JPEG data URL (what gets pinned
   * to the photo wall, where the frame is drawn in CSS).
   */
  onCapture?: (dataUrl: string, squareDataUrl: string) => void;
  /** Called with a human-readable reason when the camera can't be used. */
  onError?: (message: string) => void;
}

export interface PolaroidSceneHandle {
  /** Re-trigger the capture flow (requests webcam, shoots, re-ejects). */
  retake: () => void;
}

const PolaroidScene = forwardRef<PolaroidSceneHandle, PolaroidSceneProps>(
  function PolaroidScene({ onCapture, onError }, ref) {
  const mountRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const onCaptureRef = useRef(onCapture);
  onCaptureRef.current = onCapture;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const captureFnRef = useRef<() => void>(() => {});
  useImperativeHandle(ref, () => ({ retake: () => captureFnRef.current?.() }), []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // --- Renderer ---------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

    // Camera framing. `frameRadius` is the worst-case distance from the model's
    // pivot origin to any point it can occupy (body + fully-ejected photo). We
    // fit the tighter of the vertical/horizontal FOV, so every edge stays
    // on-screen at any tilt and any container aspect ratio.
    let frameRadius = 2;
    // 3/4 view — from the front, slightly above and to the right — so the photo
    // that slides out flat (image facing up) is clearly visible, like in Blender.
    const VIEW_DIR = new THREE.Vector3(0.32, 0.55, 1).normalize();
    // Orientation that points the camera body's front (+Z) straight at the
    // viewer — used for the "look at you" turn while a photo is taken.
    const faceTarget = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      VIEW_DIR
    );
    const frameCamera = () => {
      const vfov = THREE.MathUtils.degToRad(camera.fov);
      const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
      const fitFov = Math.min(vfov, hfov);
      const dist = (frameRadius / Math.sin(fitFov / 2)) * 1.08;
      camera.position.copy(VIEW_DIR).multiplyScalar(dist);
      camera.near = Math.max(0.1, dist - frameRadius * 2);
      camera.far = dist + frameRadius * 2;
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };

    // Self-healing size sync (handles late layout / resize).
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

    // --- Lighting ---------------------------------------------------------
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbfc4d4, 1.25));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(3, 5, 6);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xdfe6ff, 1.0);
    fillLight.position.set(-5, 1, 3);
    scene.add(fillLight);

    // --- Pivot for mouse tilt --------------------------------------------
    const pivot = new THREE.Group();
    scene.add(pivot);

    // --- State ------------------------------------------------------------
    const pointer = { x: 0, y: 0 };
    let raf = 0;
    let polaroid: THREE.Object3D | null = null;
    let photoImage: THREE.Mesh | null = null;
    let shutterButton: THREE.Object3D | null = null;
    let shutterRestY = 0;
    let polaroidRestZ = 0; // authored Z of the photo (its "ejected" resting spot)
    let ejecting = false;
    let ejectT = 0; // 0..1
    let facingUser = false; // turn to face the viewer while taking the shot
    let ejectDelay = 0; // seconds to wait (facing the user) before ejecting
    let pressT = 0; // shutter press timer (seconds remaining)
    let busy = false; // a capture is in flight

    // Hidden <video> we draw a single frame from.
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");

    // --- Load model -------------------------------------------------------
    const loader = new GLTFLoader();
    loader.load(
      "/polaroid.glb",
      (gltf) => {
        const model = gltf.scene;

        // Drop a stray default "Cube" backdrop if the export left one in.
        const cube = model.getObjectByName("Cube");
        if (cube) cube.visible = false;

        pivot.add(model);

        // Scale so the camera body reads at a consistent size.
        const body = model.getObjectByName("CameraBody_Group") ?? model;
        model.updateWorldMatrix(true, true);
        const bodySize = new THREE.Box3().setFromObject(body).getSize(new THREE.Vector3());
        const maxDim = Math.max(bodySize.x, bodySize.y, bodySize.z) || 1;
        const targetSize = 3.6;
        model.scale.setScalar(targetSize / maxDim);
        model.updateWorldMatrix(true, true);

        // The photo loads at its authored (fully-ejected) spot, sticking out the
        // front. Center the WHOLE assembly (body + ejected photo) at the origin so
        // the tilt rotates it in place and its bounding sphere never clips, then
        // frame that sphere.
        const contentBox = new THREE.Box3().setFromObject(model);
        model.position.sub(contentBox.getCenter(new THREE.Vector3()));
        model.updateWorldMatrix(true, true);
        const sphere = new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere());
        frameRadius = sphere.radius;
        frameCamera();

        // Grab the parts we animate. NOTE: the node named "Polaroid" is the whole
        // assembly (body + photo); the ejectable photo card is "PhotoCard".
        polaroid = model.getObjectByName("PhotoCard") ?? null;
        photoImage = (model.getObjectByName("PhotoImage") as THREE.Mesh) ?? null;
        shutterButton = model.getObjectByName("ClickButton") ?? null;
        if (shutterButton) shutterRestY = shutterButton.position.y;

        // Hide the photo and tuck it back into the slot until the first shot.
        if (polaroid) {
          polaroidRestZ = polaroid.position.z;
          polaroid.position.z = polaroidRestZ - EJECT_TRAVEL;
          polaroid.visible = false;
        }
      },
      undefined,
      (err) => console.error("PolaroidScene: failed to load /polaroid.glb", err)
    );

    // --- Webcam capture ---------------------------------------------------
    const flash = () => {
      const el = flashRef.current;
      if (!el) return;
      el.style.transition = "none";
      el.style.opacity = "0.9";
      // next frame, fade out
      requestAnimationFrame(() => {
        el.style.transition = "opacity 0.6s ease-out";
        el.style.opacity = "0";
      });
    };

    const capture = async () => {
      if (busy || !photoImage) return;
      // Webcam access requires a secure context (https or localhost). Over plain
      // http (e.g. a phone on the LAN IP) `navigator.mediaDevices` is undefined.
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        onErrorRef.current?.(
          "Camera needs a secure (https) connection. Open the live site to take a photo."
        );
        return;
      }
      busy = true;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        video.srcObject = stream;
        await video.play();
        // Wait until we actually have pixels.
        if (!video.videoWidth) {
          await new Promise<void>((res) => {
            video.onloadeddata = () => res();
          });
        }

        // Center-crop to a square and draw to an offscreen canvas.
        const cw = video.videoWidth || 640;
        const ch = video.videoHeight || 480;
        const s = Math.min(cw, ch);
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext("2d")!;
        // Mirror horizontally so it reads like a selfie (used for both the 3D
        // texture and the downloadable image).
        ctx.translate(512, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, (cw - s) / 2, (ch - s) / 2, s, s, 0, 0, 512, 512);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Stop the camera right after grabbing the frame.
        stream.getTracks().forEach((t) => t.stop());
        video.srcObject = null;

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = false; // match glTF UV convention

        const mat = new THREE.MeshBasicMaterial({
          map: texture,
          toneMapped: false,
          side: THREE.DoubleSide,
        });
        const old = photoImage.material as THREE.Material;
        photoImage.material = mat;
        if (old && old !== mat) old.dispose();

        // Hand the framed Polaroid back to the section for download, alongside
        // the bare square shot used for a photo-wall submission.
        const square = canvas.toDataURL("image/jpeg", 0.85);
        composePolaroid(canvas).then((url) => onCaptureRef.current?.(url, square));

        flash();
        if (polaroid) {
          polaroid.visible = true;
          polaroid.position.z = polaroidRestZ - EJECT_TRAVEL; // start tucked in
        }
        pressT = 0.25;
        // Turn to face the viewer for the shot, then (after the beat) the
        // animation loop returns to the 3/4 view and ejects the photo.
        facingUser = true;
        ejecting = false;
        ejectT = 0;
        ejectDelay = 0.6;
      } catch (err) {
        const name = (err as { name?: string })?.name;
        let msg = "Couldn't access the camera. Please try again.";
        if (name === "NotAllowedError" || name === "SecurityError") {
          msg = "Camera access was blocked. Allow camera permission and try again.";
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          msg = "No camera was found on this device.";
        } else if (name === "NotReadableError") {
          msg = "The camera is in use by another app. Close it and try again.";
        }
        onErrorRef.current?.(msg);
        console.warn("PolaroidScene: camera unavailable", err);
      } finally {
        busy = false;
      }
    };
    captureFnRef.current = capture;

    // --- Pointer handlers -------------------------------------------------
    const onPointerMove = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    };
    // Treat a tap/click anywhere on the canvas as "take a photo". We detect a tap
    // (vs. a scroll/drag) so touch scrolling doesn't fire the camera — this is far
    // more reliable on touch than requiring a precise raycast hit on the model.
    let downX = 0;
    let downY = 0;
    let downT = 0;
    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      downT = performance.now();
    };
    const onPointerUp = (e: PointerEvent) => {
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (moved < 14 && performance.now() - downT < 700) capture();
    };

    window.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerdown", onPointerDown);
    mount.addEventListener("pointerup", onPointerUp);

    // --- Animation loop ---------------------------------------------------
    const clock = new THREE.Clock();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const animate = () => {
      syncSize();
      const dt = Math.min(clock.getDelta(), 0.05);

      if (facingUser) {
        // Turn the camera to look straight at the viewer for the shot.
        pivot.quaternion.slerp(faceTarget, 0.14);
      } else {
        // Otherwise ease the tilt toward the pointer.
        const targetRotY = pointer.x * 0.5;
        const targetRotX = pointer.y * 0.32;
        pivot.rotation.y += (targetRotY - pivot.rotation.y) * 0.07;
        pivot.rotation.x += (targetRotX - pivot.rotation.x) * 0.07;
      }

      // After the brief "facing" beat, return to the 3/4 view and slide the photo out.
      if (ejectDelay > 0) {
        ejectDelay -= dt;
        if (ejectDelay <= 0) {
          facingUser = false;
          ejecting = true;
          ejectT = 0;
        }
      }

      // Shutter button press/return.
      if (shutterButton) {
        const pressed = pressT > 0;
        if (pressed) pressT -= dt;
        const target = pressed ? shutterRestY - 0.12 : shutterRestY;
        shutterButton.position.y += (target - shutterButton.position.y) * 0.3;
      }

      // Photo ejection — slides forward out of the front slot.
      if (ejecting && polaroid) {
        ejectT = Math.min(1, ejectT + dt / EJECT_DURATION);
        const from = polaroidRestZ - EJECT_TRAVEL;
        const to = polaroidRestZ;
        polaroid.position.z = from + (to - from) * easeOut(ejectT);
        if (ejectT >= 1) ejecting = false;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    // --- Cleanup ----------------------------------------------------------
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerdown", onPointerDown);
      mount.removeEventListener("pointerup", onPointerUp);
      const s = video.srcObject as MediaStream | null;
      if (s) s.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const m = mesh.material;
        if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
        else if (m) (m as THREE.Material).dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className={styles.sceneWrap}>
      <div ref={mountRef} className={styles.canvasMount} />
      <div ref={flashRef} className={styles.flash} aria-hidden="true" />
    </div>
  );
});

export default PolaroidScene;
