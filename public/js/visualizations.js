// ========== D3.js VISUALIZATIONS ==========

function drawProgressChart(data, containerId) {
  const el = document.getElementById(containerId);
  if (!el || !window.d3 || !data.length) return;
  el.innerHTML = '';

  const margin = { top: 10, right: 16, bottom: 30, left: 30 };
  const width = el.clientWidth - margin.left - margin.right || 400;
  const height = 180;

  const svg = d3.select(`#${containerId}`).append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(data.map(d => d.day)).range([0, width]).padding(0.25);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.events) || 1]).range([height, 0]).nice();

  // Grid
  svg.append('g').selectAll('line').data(y.ticks(4)).enter().append('line')
    .attr('x1', 0).attr('x2', width)
    .attr('y1', d => y(d)).attr('y2', d => y(d))
    .attr('stroke', '#f0f0f0').attr('stroke-width', 1);

  // Area
  const area = d3.area().x(d => x(d.day) + x.bandwidth() / 2).y0(height).y1(d => y(d.events)).curve(d3.curveCatmullRom);
  svg.append('path').datum(data).attr('fill', 'rgba(255,149,0,0.15)').attr('d', area);

  // Line
  const line = d3.line().x(d => x(d.day) + x.bandwidth() / 2).y(d => y(d.events)).curve(d3.curveCatmullRom);
  svg.append('path').datum(data).attr('fill', 'none').attr('stroke', '#FF9500').attr('stroke-width', 2.5).attr('d', line);

  // Dots
  svg.selectAll('circle').data(data).enter().append('circle')
    .attr('cx', d => x(d.day) + x.bandwidth() / 2)
    .attr('cy', d => y(d.events))
    .attr('r', 4).attr('fill', '#FF9500').attr('stroke', 'white').attr('stroke-width', 2);

  // Axes
  const tickFreq = Math.max(1, Math.floor(data.length / 6));
  svg.append('g').attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickValues(data.filter((_, i) => i % tickFreq === 0).map(d => d.day)).tickFormat(d => d.slice(5)))
    .selectAll('text').style('font-size', '11px').style('fill', '#9CA3AF');
  svg.append('g').call(d3.axisLeft(y).ticks(4)).selectAll('text').style('font-size', '11px').style('fill', '#9CA3AF');
  svg.selectAll('.domain').remove();
}

function drawActivityChart(data, containerId) {
  const el = document.getElementById(containerId);
  if (!el || !window.d3 || !data.length) return;
  el.innerHTML = '';

  const margin = { top: 8, right: 12, bottom: 24, left: 28 };
  const width = el.clientWidth - margin.left - margin.right || 300;
  const height = 140;

  const svg = d3.select(`#${containerId}`).append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(data.map(d => d.day)).range([0, width]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.completed || d.events || 0) || 1]).range([height, 0]);

  const color = d3.scaleSequential().domain([0, d3.max(data, d => d.completed || 0) || 1]).interpolator(t => d3.interpolate('#FFE49A', '#FF9500')(t));

  svg.selectAll('rect').data(data).enter().append('rect')
    .attr('x', d => x(d.day))
    .attr('y', d => y(d.completed || 0))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.completed || 0))
    .attr('fill', d => color(d.completed || 0))
    .attr('rx', 3);

  const tickFreq = Math.max(1, Math.floor(data.length / 5));
  svg.append('g').attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickValues(data.filter((_, i) => i % tickFreq === 0).map(d => d.day)).tickFormat(d => d.slice(5)))
    .selectAll('text').style('font-size', '10px').style('fill', '#9CA3AF');
  svg.selectAll('.domain, .tick line').remove();
}

function drawTopicsChart(data, containerId) {
  const el = document.getElementById(containerId);
  if (!el || !window.d3 || !data.length) return;
  el.innerHTML = '';

  const margin = { top: 8, right: 16, bottom: 8, left: 120 };
  const width = el.clientWidth - margin.left - margin.right || 300;
  const height = Math.max(150, data.length * 28);

  const svg = d3.select(`#${containerId}`).append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, d3.max(data, d => d.total_time) || 1]).range([0, width]);
  const y = d3.scaleBand().domain(data.map(d => d.title)).range([0, height]).padding(0.3);

  svg.selectAll('rect').data(data).enter().append('rect')
    .attr('y', d => y(d.title))
    .attr('width', d => x(d.total_time))
    .attr('height', y.bandwidth())
    .attr('fill', '#FFD060').attr('rx', 4);

  svg.append('g').call(d3.axisLeft(y).tickFormat(d => d.length > 18 ? d.slice(0, 16) + '…' : d))
    .selectAll('text').style('font-size', '11px');
  svg.selectAll('.domain').remove();

  svg.selectAll('.time-label').data(data).enter().append('text')
    .attr('x', d => x(d.total_time) + 4)
    .attr('y', d => y(d.title) + y.bandwidth() / 2 + 4)
    .text(d => formatTime(d.total_time))
    .style('font-size', '11px').style('fill', '#6B7280');
}

function drawRadarChart(blockData, containerId) {
  const el = document.getElementById(containerId);
  if (!el || !window.d3) return;
  el.innerHTML = '';

  const w = el.clientWidth || 300;
  const h = 240;
  const cx = w / 2, cy = h / 2;
  const r = Math.min(cx, cy) - 30;

  const labels = blockData.map(b => b.title.replace(/\d+ блок: /,'').slice(0, 20));
  const values = blockData.map(b => (b.total > 0 ? b.completed / b.total : 0));
  const n = Math.max(labels.length, 4);
  const axes = [...labels, ...Array(Math.max(0, n - labels.length)).fill('—')];

  const svg = d3.select(`#${containerId}`).append('svg').attr('width', w).attr('height', h);
  const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);

  const angle = (i) => (i / axes.length) * 2 * Math.PI - Math.PI / 2;
  const levelCount = 5;

  // Grid
  for (let lvl = 1; lvl <= levelCount; lvl++) {
    const rr = (lvl / levelCount) * r;
    const pts = axes.map((_, i) => [rr * Math.cos(angle(i)), rr * Math.sin(angle(i))]);
    g.append('polygon').attr('points', pts.map(p => p.join(',')).join(' '))
      .attr('fill', 'none').attr('stroke', '#E5E7EB').attr('stroke-width', 1);
  }

  // Spokes
  axes.forEach((_, i) => {
    g.append('line').attr('x1', 0).attr('y1', 0).attr('x2', r * Math.cos(angle(i))).attr('y2', r * Math.sin(angle(i)))
      .attr('stroke', '#E5E7EB');
  });

  // Data
  const dataVals = values.length >= 2 ? values : [0, 0];
  while (dataVals.length < axes.length) dataVals.push(0);
  const pts = dataVals.map((v, i) => [(v * r) * Math.cos(angle(i)), (v * r) * Math.sin(angle(i))]);
  g.append('polygon').attr('points', pts.map(p => p.join(',')).join(' '))
    .attr('fill', 'rgba(255,149,0,0.25)').attr('stroke', '#FF9500').attr('stroke-width', 2);

  // Labels
  axes.forEach((lbl, i) => {
    const x = (r + 18) * Math.cos(angle(i));
    const y = (r + 18) * Math.sin(angle(i));
    g.append('text').attr('x', x).attr('y', y).text(lbl).attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle').style('font-size', '10px').style('fill', '#6B7280');
  });
}

// ========== THREE.js BRAIN VISUALIZATION ==========

let threeRenderer = null;
let threeAnimFrame = null;

function initBrainVisualization(containerId) {
  if (!window.THREE) return;
  const container = document.getElementById(containerId);
  if (!container) return;

  // Cleanup previous
  if (threeAnimFrame) cancelAnimationFrame(threeAnimFrame);
  if (threeRenderer) { threeRenderer.dispose(); }

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
  threeRenderer = renderer;

  // Brain sphere (wireframe)
  const brainGeo = new THREE.IcosahedronGeometry(1.4, 3);
  const brainMat = new THREE.MeshPhongMaterial({ color: 0x4488ff, wireframe: false, transparent: true, opacity: 0.15 });
  const brain = new THREE.Mesh(brainGeo, brainMat);
  scene.add(brain);

  const wireMat = new THREE.MeshBasicMaterial({ color: 0x6699ff, wireframe: true, transparent: true, opacity: 0.25 });
  const brainWire = new THREE.Mesh(brainGeo, wireMat);
  scene.add(brainWire);

  // Neural nodes
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

  // Connections (synapses)
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

  // Lights
  const ambientLight = new THREE.AmbientLight(0x334466, 0.8);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xFF9500, 1.5, 10);
  pointLight.position.set(3, 3, 3);
  scene.add(pointLight);

  // Animate
  let t = 0;
  function animate() {
    threeAnimFrame = requestAnimationFrame(animate);
    t += 0.008;
    brain.rotation.y = t * 0.3;
    brainWire.rotation.y = t * 0.3;

    // Pulse connections
    connections.forEach(c => {
      const pulse = 0.3 + 0.4 * Math.sin(t * c.speed * 100 + c.phase);
      c.mat.opacity = pulse;
    });

    // Pulse nodes
    nodes.forEach((n, i) => {
      const s = 1 + 0.3 * Math.sin(t * 2 + i * 0.5);
      n.scale.setScalar(s);
    });

    renderer.render(scene, camera);
  }
  animate();

  // Resize
  window.addEventListener('resize', () => {
    const cw = container.clientWidth;
    camera.aspect = cw / h;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, h);
  });
}

function destroyThree() {
  if (threeAnimFrame) { cancelAnimationFrame(threeAnimFrame); threeAnimFrame = null; }
  if (threeRenderer) { threeRenderer.dispose(); threeRenderer = null; }
}
