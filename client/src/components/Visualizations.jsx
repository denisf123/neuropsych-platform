import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export function ProgressChart({ data }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current || !data?.length) return;
    const el = ref.current;
    el.innerHTML = '';
    const margin = { top: 10, right: 16, bottom: 30, left: 30 };
    const width = el.clientWidth - margin.left - margin.right || 400;
    const height = 180;
    const svg = d3.select(el).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleBand().domain(data.map(d => d.day)).range([0, width]).padding(0.25);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.events) || 1]).range([height, 0]).nice();
    svg.append('g').selectAll('line').data(y.ticks(4)).enter().append('line')
      .attr('x1', 0).attr('x2', width).attr('y1', d => y(d)).attr('y2', d => y(d))
      .attr('stroke', '#f0f0f0').attr('stroke-width', 1);
    const area = d3.area().x(d => x(d.day) + x.bandwidth() / 2).y0(height).y1(d => y(d.events)).curve(d3.curveCatmullRom);
    svg.append('path').datum(data).attr('fill', 'rgba(255,149,0,0.15)').attr('d', area);
    const line = d3.line().x(d => x(d.day) + x.bandwidth() / 2).y(d => y(d.events)).curve(d3.curveCatmullRom);
    svg.append('path').datum(data).attr('fill', 'none').attr('stroke', '#FF9500').attr('stroke-width', 2.5).attr('d', line);
    svg.selectAll('circle').data(data).enter().append('circle')
      .attr('cx', d => x(d.day) + x.bandwidth() / 2).attr('cy', d => y(d.events))
      .attr('r', 4).attr('fill', '#FF9500').attr('stroke', 'white').attr('stroke-width', 2);
    const tickFreq = Math.max(1, Math.floor(data.length / 6));
    svg.append('g').attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickValues(data.filter((_, i) => i % tickFreq === 0).map(d => d.day)).tickFormat(d => d.slice(5)))
      .selectAll('text').style('font-size', '11px').style('fill', '#9CA3AF');
    svg.append('g').call(d3.axisLeft(y).ticks(4)).selectAll('text').style('font-size', '11px').style('fill', '#9CA3AF');
    svg.selectAll('.domain').remove();
  }, [data]);
  return <div ref={ref} style={{ width: '100%', height: 220 }} />;
}

export function ActivityChart({ data }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current || !data?.length) return;
    const el = ref.current;
    el.innerHTML = '';
    const margin = { top: 8, right: 12, bottom: 24, left: 28 };
    const width = el.clientWidth - margin.left - margin.right || 300;
    const height = 140;
    const svg = d3.select(el).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleBand().domain(data.map(d => d.day)).range([0, width]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.completed || d.events || 0) || 1]).range([height, 0]);
    const color = d3.scaleSequential().domain([0, d3.max(data, d => d.completed || 0) || 1]).interpolator(t => d3.interpolate('#FFE49A', '#FF9500')(t));
    svg.selectAll('rect').data(data).enter().append('rect')
      .attr('x', d => x(d.day)).attr('y', d => y(d.completed || 0))
      .attr('width', x.bandwidth()).attr('height', d => height - y(d.completed || 0))
      .attr('fill', d => color(d.completed || 0)).attr('rx', 3);
    const tickFreq = Math.max(1, Math.floor(data.length / 5));
    svg.append('g').attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickValues(data.filter((_, i) => i % tickFreq === 0).map(d => d.day)).tickFormat(d => d.slice(5)))
      .selectAll('text').style('font-size', '10px').style('fill', '#9CA3AF');
    svg.selectAll('.domain, .tick line').remove();
  }, [data]);
  return <div ref={ref} style={{ width: '100%', height: 180 }} />;
}

export function TopicsChart({ data }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current || !data?.length) return;
    const el = ref.current;
    el.innerHTML = '';
    const margin = { top: 8, right: 16, bottom: 8, left: 120 };
    const width = el.clientWidth - margin.left - margin.right || 300;
    const height = Math.max(150, data.length * 28);
    const svg = d3.select(el).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain([0, d3.max(data, d => d.total_time) || 1]).range([0, width]);
    const y = d3.scaleBand().domain(data.map(d => d.title)).range([0, height]).padding(0.3);
    svg.selectAll('rect').data(data).enter().append('rect')
      .attr('y', d => y(d.title)).attr('width', d => x(d.total_time))
      .attr('height', y.bandwidth()).attr('fill', '#FFD060').attr('rx', 4);
    svg.append('g').call(d3.axisLeft(y).tickFormat(d => d.length > 18 ? d.slice(0, 16) + '…' : d))
      .selectAll('text').style('font-size', '11px');
    svg.selectAll('.domain').remove();
  }, [data]);
  return <div ref={ref} style={{ width: '100%', minHeight: 220 }} />;
}

export function RadarChart({ blockData }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current || !blockData?.length) return;
    const el = ref.current;
    el.innerHTML = '';
    const w = el.clientWidth || 300;
    const h = 240;
    const cx = w / 2, cy = h / 2;
    const r = Math.min(cx, cy) - 30;
    const labels = blockData.map(b => b.title.replace(/\d+ блок: /, '').slice(0, 20));
    const values = blockData.map(b => (b.total > 0 ? b.completed / b.total : 0));
    const n = Math.max(labels.length, 4);
    const axes = [...labels, ...Array(Math.max(0, n - labels.length)).fill('—')];
    const svg = d3.select(el).append('svg').attr('width', w).attr('height', h);
    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);
    const angle = (i) => (i / axes.length) * 2 * Math.PI - Math.PI / 2;
    const levelCount = 5;
    for (let lvl = 1; lvl <= levelCount; lvl++) {
      const rr = (lvl / levelCount) * r;
      const pts = axes.map((_, i) => [rr * Math.cos(angle(i)), rr * Math.sin(angle(i))]);
      g.append('polygon').attr('points', pts.map(p => p.join(',')).join(' '))
        .attr('fill', 'none').attr('stroke', '#E5E7EB').attr('stroke-width', 1);
    }
    axes.forEach((_, i) => {
      g.append('line').attr('x1', 0).attr('y1', 0).attr('x2', r * Math.cos(angle(i))).attr('y2', r * Math.sin(angle(i)))
        .attr('stroke', '#E5E7EB');
    });
    const dataVals = values.length >= 2 ? [...values] : [0, 0];
    while (dataVals.length < axes.length) dataVals.push(0);
    const pts = dataVals.map((v, i) => [(v * r) * Math.cos(angle(i)), (v * r) * Math.sin(angle(i))]);
    g.append('polygon').attr('points', pts.map(p => p.join(',')).join(' '))
      .attr('fill', 'rgba(255,149,0,0.25)').attr('stroke', '#FF9500').attr('stroke-width', 2);
    axes.forEach((lbl, i) => {
      const xx = (r + 18) * Math.cos(angle(i));
      const yy = (r + 18) * Math.sin(angle(i));
      g.append('text').attr('x', xx).attr('y', yy).text(lbl).attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle').style('font-size', '10px').style('fill', '#6B7280');
    });
  }, [blockData]);
  return <div ref={ref} style={{ width: '100%', height: 280 }} />;
}
