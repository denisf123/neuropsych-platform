import { useEffect, useRef } from 'react';

export default function BrainVisualization() {
  const containerRef = useRef();
  const rendererRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const THREE = window.THREE;
    if (!THREE || !containerRef.current) return;

    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight || 300;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const brainGeo = new THREE.IcosahedronGeometry(1.4, 3);
    const brainMat = new THREE.MeshPhongMaterial({ color: 0x4488ff, wireframe: false, transparent: true, opacity: 0.15 });
    const brain = new THREE.Mesh(brainGeo, brainMat);
    scene.add(brain);

    const wireMat = new THREE.MeshBasicMaterial({ color: 0x6699ff, wireframe: true, transparent: true, opacity: 0.25 });
    const brainWire = new THREE.Mesh(brainGeo, wireMat);
    scene.add(brainWire);

    const nodeGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const nodes = [];
    const nodePositions = [];
    const nodeColors = [0xFF9500, 0xFFD060, 0x6699ff, 0x10B981, 0xFF6B6B];
    const numNodes = 52; // 52 поля Бродмана — цитоархитектонические области коры головного мозга

    for (let i = 0; i < numNodes; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.2 + Math.random() * 0.3;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      const color = nodeColors[Math.floor(Math.random() * nodeColors.length)];
      const mat = new THREE.MeshBasicMaterial({ color });
      const node = new THREE.Mesh(nodeGeo, mat);
      node.position.set(x, y, z);
      scene.add(node);
      nodes.push(node);
      nodePositions.push(new THREE.Vector3(x, y, z));
    }

    const connections = [];
    for (let i = 0; i < numNodes; i++) {
      const numConns = 2 + Math.floor(Math.random() * 2);
      for (let c = 0; c < numConns; c++) {
        const j = Math.floor(Math.random() * numNodes);
        if (i !== j && nodePositions[i].distanceTo(nodePositions[j]) < 1.2) {
          const geo = new THREE.BufferGeometry().setFromPoints([nodePositions[i], nodePositions[j]]);
          const mat = new THREE.LineBasicMaterial({ color: 0x334466, transparent: true, opacity: 0.5 });
          const line = new THREE.Line(geo, mat);
          scene.add(line);
          connections.push({ line, mat, speed: 0.005 + Math.random() * 0.01, phase: Math.random() * Math.PI * 2 });
        }
      }
    }

    scene.add(new THREE.AmbientLight(0x334466, 0.8));
    const pointLight = new THREE.PointLight(0xFF9500, 1.5, 10);
    pointLight.position.set(3, 3, 3);
    scene.add(pointLight);

    let t = 0;
    function animate() {
      animRef.current = requestAnimationFrame(animate);
      t += 0.008;
      brain.rotation.y = t * 0.3;
      brainWire.rotation.y = t * 0.3;
      connections.forEach(c => { c.mat.opacity = 0.3 + 0.4 * Math.sin(t * c.speed * 100 + c.phase); });
      nodes.forEach((n, i) => { n.scale.setScalar(1 + 0.3 * Math.sin(t * 2 + i * 0.5)); });
      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      const cw = container.clientWidth;
      camera.aspect = cw / h;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  return <div className="three-container" ref={containerRef} />;
}
