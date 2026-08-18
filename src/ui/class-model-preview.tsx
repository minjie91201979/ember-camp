import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createPlayerRig } from '../render/actor-rig';
import type { PlayerClassId } from '../game/data/classes';

type Props = {
  classId: PlayerClassId;
};

/**
 * 职业选择界面的实时 3D 角色预览。
 * 复用游戏本体的 createPlayerRig（box 建模 + 材质配色），独立 WebGL 上下文，
 * 选中职业变化时只替换模型、不重建渲染器；卸载时释放上下文避免泄漏。
 */
export function ClassModelPreview({ classId }: Props): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    const w = host.clientWidth || 240;
    const h = host.clientHeight || 260;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 50);
    camera.position.set(0.35, 0.72, 3.5);
    camera.lookAt(0, 0.56, 0);

    const hemi = new THREE.HemisphereLight(0x9fb4c8, 0x140f0c, 0.75);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffd9a0, 1.25);
    key.position.set(2.4, 3.2, 2.2);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x6ea8ff, 0.55);
    rim.position.set(-2.4, 1.2, -2.0);
    scene.add(rim);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;

    const animate = (now: number): void => {
      rafRef.current = requestAnimationFrame(animate);
      const dt = lastRef.current ? (now - lastRef.current) / 1000 : 0;
      lastRef.current = now;
      tRef.current += dt;
      const m = modelRef.current;
      if (m) {
        m.rotation.y += dt * 0.6;
        m.position.y = Math.sin(tRef.current * 1.4) * 0.025;
      }
      renderer.render(scene, camera);
    };
    rafRef.current = requestAnimationFrame(animate);

    const ro = new ResizeObserver(() => {
      const cw = host.clientWidth;
      const ch = host.clientHeight;
      if (cw > 0 && ch > 0) {
        renderer.setSize(cw, ch);
        camera.aspect = cw / ch;
        camera.updateProjectionMatrix();
      }
    });
    ro.observe(host);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement.parentNode === host) {
          host.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
      }
      sceneRef.current = null;
      cameraRef.current = null;
      modelRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) {
      return;
    }
    if (modelRef.current) {
      scene.remove(modelRef.current);
      disposeObject(modelRef.current);
      modelRef.current = null;
    }
    const rig = createPlayerRig(classId);
    rig.root.rotation.y = -0.4;
    scene.add(rig.root);
    modelRef.current = rig.root;
  }, [classId]);

  return <div className="class-select__preview" ref={hostRef} />;
}

function disposeObject(obj: THREE.Object3D): void {
  obj.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const material = mesh.material;
    if (Array.isArray(material)) {
      for (const m of material) {
        m.dispose();
      }
    } else if (material) {
      material.dispose();
    }
  });
}
