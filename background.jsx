// background.jsx — ambient network topology constellation
//
// Renders ~30 nodes scattered across the viewport connected by faint edges.
// Most nodes are green (link up). Occasional amber, rare red. Packets travel
// down edges on staggered cadences. Subtle cursor parallax shifts nodes by
// a few pixels based on cursor position relative to the viewport center.
// Honors prefers-reduced-motion (renders static graph, no pulses, no parallax).

function NetworkBg() {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let state = {
      nodes: [],
      edges: [],
      pulses: [],
      mouse: { x: 0.5, y: 0.5 },
      offX: 0,
      offY: 0,
      width: 0,
      height: 0,
    };
    let raf;
    let lastSpawn = 0;

    // ── Build the constellation ───────────────────────────────────────
    function rebuild() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      state.width = w;
      state.height = h;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width  = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Density: ~30 nodes at 1440x900, scale loosely with area
      const area = w * h;
      const baseArea = 1440 * 900;
      const count = Math.max(18, Math.min(48, Math.round(30 * Math.sqrt(area / baseArea))));

      // Place nodes with min-distance rejection so they're not clumped
      const nodes = [];
      const minDist = Math.sqrt(area / count) * 0.55;
      let attempts = 0;
      while (nodes.length < count && attempts < count * 30) {
        attempts++;
        const candidate = {
          x: Math.random() * w,
          y: Math.random() * h,
        };
        const tooClose = nodes.some(n => {
          const dx = n.x - candidate.x;
          const dy = n.y - candidate.y;
          return Math.sqrt(dx * dx + dy * dy) < minDist;
        });
        if (tooClose) continue;
        const r = Math.random();
        let kind;
        if (r < 0.02)      kind = "red";    // ~2%
        else if (r < 0.10) kind = "amber";  // ~8%
        else               kind = "green";  // ~90%
        nodes.push({
          x: candidate.x,
          y: candidate.y,
          baseX: candidate.x,
          baseY: candidate.y,
          depth: 0.35 + Math.random() * 0.65,
          phase: Math.random() * Math.PI * 2,
          breathFreq: 0.0008 + Math.random() * 0.0004,
          kind,
        });
      }

      // Edges: connect each node to its 2-3 nearest neighbors, but cap
      // edge length so we don't draw cross-screen lines.
      const maxEdgeLen = Math.min(w, h) * 0.34;
      const edgeSet = new Set();
      const edges = [];
      for (let i = 0; i < nodes.length; i++) {
        const candidates = [];
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const dx = nodes[i].baseX - nodes[j].baseX;
          const dy = nodes[i].baseY - nodes[j].baseY;
          const d = Math.hypot(dx, dy);
          if (d < maxEdgeLen) candidates.push({ j, d });
        }
        candidates.sort((a, b) => a.d - b.d);
        const want = 2 + (Math.random() < 0.4 ? 1 : 0);
        for (let k = 0; k < Math.min(want, candidates.length); k++) {
          const j = candidates[k].j;
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (edgeSet.has(key)) continue;
          edgeSet.add(key);
          edges.push({ a: i, b: j, length: candidates[k].d });
        }
      }

      state.nodes = nodes;
      state.edges = edges;
      state.pulses = [];
    }

    // ── Spawn a packet pulse on a random edge ─────────────────────────
    function spawnPulse(now) {
      if (state.edges.length === 0) return;
      const edge = state.edges[Math.floor(Math.random() * state.edges.length)];
      // Direction: random
      const reverse = Math.random() < 0.5;
      const src = state.nodes[reverse ? edge.b : edge.a];
      // Pulse color follows source node kind
      let color;
      if      (src.kind === "amber") color = "#f59e0b";
      else if (src.kind === "red")   color = "#ef4444";
      else                            color = "#22c55e";
      state.pulses.push({
        edge,
        reverse,
        color,
        start: now,
        duration: 1700 + Math.random() * 800, // ~2s mid-tempo
      });
    }

    // ── Animation loop ────────────────────────────────────────────────
    function tick(now) {
      ctx.clearRect(0, 0, state.width, state.height);

      // Smooth cursor parallax (lerp toward target)
      if (!reduceMotion) {
        const targetX = (state.mouse.x - 0.5) * 24;
        const targetY = (state.mouse.y - 0.5) * 24;
        state.offX += (targetX - state.offX) * 0.06;
        state.offY += (targetY - state.offY) * 0.06;
      }

      // Apply parallax to each node based on its depth
      const offX = state.offX;
      const offY = state.offY;
      for (const n of state.nodes) {
        n.x = n.baseX + offX * n.depth;
        n.y = n.baseY + offY * n.depth;
      }

      // ── Draw edges (very faint baseline) ───────────────────────────
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = "rgba(180, 200, 220, 0.07)";
      ctx.beginPath();
      for (const e of state.edges) {
        const a = state.nodes[e.a];
        const b = state.nodes[e.b];
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();

      // ── Draw pulses ────────────────────────────────────────────────
      if (!reduceMotion) {
        for (let i = state.pulses.length - 1; i >= 0; i--) {
          const p = state.pulses[i];
          const t = (now - p.start) / p.duration;
          if (t >= 1) { state.pulses.splice(i, 1); continue; }
          const a = state.nodes[p.reverse ? p.edge.b : p.edge.a];
          const b = state.nodes[p.reverse ? p.edge.a : p.edge.b];
          const headT = t;
          const tailT = Math.max(0, t - 0.18);
          const hx = a.x + (b.x - a.x) * headT;
          const hy = a.y + (b.y - a.y) * headT;
          const tx = a.x + (b.x - a.x) * tailT;
          const ty = a.y + (b.y - a.y) * tailT;

          // Trail
          const grad = ctx.createLinearGradient(tx, ty, hx, hy);
          grad.addColorStop(0, p.color + "00");
          grad.addColorStop(1, p.color + "cc");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(hx, hy);
          ctx.stroke();

          // Head dot + small glow
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(hx, hy, 1.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // ── Draw nodes (with subtle "breath" pulse on green ones) ──────
      for (const n of state.nodes) {
        let core, glow;
        if      (n.kind === "amber") { core = "#f59e0b"; glow = "rgba(245,158,11,0.55)"; }
        else if (n.kind === "red")   { core = "#ef4444"; glow = "rgba(239,68,68,0.65)"; }
        else                          { core = "#22c55e"; glow = "rgba(34,197,94,0.50)"; }

        const breath = reduceMotion
          ? 1
          : 0.85 + Math.sin(now * n.breathFreq + n.phase) * 0.15;
        const radius = 1.8 * breath;

        // Outer glow (cheap: single arc with shadow)
        ctx.shadowBlur = 6 * breath;
        ctx.shadowColor = glow;
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── Spawn new pulses on cadence ────────────────────────────────
      if (!reduceMotion) {
        // Spawn rate scales with edge count so density doesn't matter
        const spawnInterval = 380 + Math.random() * 380;
        if (now - lastSpawn > spawnInterval) {
          spawnPulse(now);
          lastSpawn = now;
        }
      }

      raf = requestAnimationFrame(tick);
    }

    // ── Event handlers ────────────────────────────────────────────────
    function onMouse(e) {
      state.mouse.x = e.clientX / window.innerWidth;
      state.mouse.y = e.clientY / window.innerHeight;
    }
    function onLeave() {
      state.mouse.x = 0.5;
      state.mouse.y = 0.5;
    }

    rebuild();
    window.addEventListener("resize", rebuild);
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("mouseout", onLeave);

    if (reduceMotion) {
      // Render a single static frame
      tick(0);
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", rebuild);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("mouseout", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="network-bg" aria-hidden="true"></canvas>;
}

Object.assign(window, { NetworkBg });
