// ═══════════════════════════════════════════════════
// STRUCTURAL SYNTHESIS — shared shell
// shader ambient bg · scroll reveal · counters · edit · nav · clock
// ═══════════════════════════════════════════════════

(function () {
  'use strict';

  // ─── Sticky nav scroll state ───
  const nav = document.querySelector('nav.topnav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ─── Live clock (LA / America/Los_Angeles) ───
  const clocks = document.querySelectorAll('[data-clock]');
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit', hour12: false
    });
    const tick = () => {
      const t = fmt.format(new Date());
      clocks.forEach(el => el.textContent = t + ' PT');
    };
    tick();
    setInterval(tick, 15000);
  }

  // ─── Scroll reveal (Intersection Observer) ───
  const revealables = document.querySelectorAll('.reveal');
  if (revealables.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealables.forEach(el => io.observe(el));
  } else {
    revealables.forEach(el => el.classList.add('in'));
  }

  // ─── Animated counters ───
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseFloat(el.dataset.count);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const decimals = parseInt(el.dataset.decimals || '0', 10);
        const dur = parseInt(el.dataset.dur || '1400', 10);
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          const v = target * eased;
          el.textContent = prefix + v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        co.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(el => co.observe(el));
  }

  // ─── Edit mode ───
  const STORAGE_KEY = 'portfolio_edits_v2';
  let edits = {};
  try { edits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch {}

  document.querySelectorAll('[data-edit]').forEach(el => {
    const key = el.dataset.edit;
    if (edits[key] != null) el.textContent = edits[key];
  });

  const editBtn = document.getElementById('editBtn');
  let editing = false;
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      editing = !editing;
      editBtn.classList.toggle('active', editing);
      editBtn.textContent = editing ? '✓ Save' : '✎ Edit';
      document.querySelectorAll('[data-edit]').forEach(el => { el.contentEditable = editing; });
      if (!editing) {
        document.querySelectorAll('[data-edit]').forEach(el => { edits[el.dataset.edit] = el.textContent.trim(); });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
      }
    });
  }

  // ─── Three.js ambient shader background ───
  function initShaderBg() {
    const canvas = document.getElementById('shader-bg');
    if (!canvas || typeof THREE === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5;

    // Full-screen shader plane
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPrimary: { value: new THREE.Color(0xd9b9ff) },
          uSecondary: { value: new THREE.Color(0xa8c8ff) },
          uDeep: { value: new THREE.Color(0x43107a) },
        },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`,
        fragmentShader: `
          precision highp float;
          varying vec2 vUv;
          uniform float uTime;
          uniform vec3 uPrimary;
          uniform vec3 uSecondary;
          uniform vec3 uDeep;

          // 2D hash + value noise
          float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
          float n(vec2 p){
            vec2 i = floor(p), f = fract(p);
            float a = h(i), b = h(i+vec2(1,0)), c = h(i+vec2(0,1)), d = h(i+vec2(1,1));
            vec2 u = f*f*(3.0-2.0*f);
            return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
          }
          float fbm(vec2 p){
            float v = 0.0; float amp = 0.5;
            for (int i=0;i<4;i++){ v += amp * n(p); p *= 2.05; amp *= 0.5; }
            return v;
          }

          void main(){
            vec2 uv = vUv;
            float t = uTime * 0.04;
            float f = fbm(uv * 2.6 + vec2(t, -t * 0.7));
            float g = fbm(uv * 5.0 - vec2(t * 1.2, t * 0.5));
            vec3 base = vec3(0.03, 0.025, 0.045);
            vec3 c1 = mix(base, uDeep * 0.45, smoothstep(0.3, 0.9, f));
            vec3 c2 = mix(c1, uPrimary * 0.18, smoothstep(0.4, 0.95, g));
            vec3 c3 = mix(c2, uSecondary * 0.12, smoothstep(0.55, 1.0, fbm(uv * 1.2 + t)));
            float vig = smoothstep(1.15, 0.25, length(uv - 0.5));
            gl_FragColor = vec4(c3 * vig, 1.0);
          }
        `,
        depthTest: false, depthWrite: false,
      })
    );
    plane.frustumCulled = false;
    scene.add(plane);

    // Drifting purple particles
    const pCount = 90;
    const positions = new Float32Array(pCount * 3);
    const colors = new Float32Array(pCount * 3);
    const p = new THREE.Color(0xd9b9ff), s = new THREE.Color(0xa8c8ff);
    for (let i = 0; i < pCount; i++) {
      positions[3*i]   = (Math.random() - 0.5) * 16;
      positions[3*i+1] = (Math.random() - 0.5) * 10;
      positions[3*i+2] = -Math.random() * 6;
      const c = Math.random() < 0.6 ? p : s;
      colors[3*i]=c.r; colors[3*i+1]=c.g; colors[3*i+2]=c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      size: 0.05, vertexColors: true, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    scene.add(particles);

    // Wireframe dodecahedron focal element (subtle)
    const poly = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.7, 1),
      new THREE.MeshBasicMaterial({ color: 0xd9b9ff, wireframe: true, transparent: true, opacity: 0.09 })
    );
    poly.position.set(2.5, -0.3, -2);
    scene.add(poly);

    const clock = new THREE.Clock();
    let frame = 0;
    let lastTime = 0;
    const targetFps = 45;

    function resize() {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);

    function tick() {
      frame = requestAnimationFrame(tick);
      const now = performance.now();
      if (now - lastTime < 1000 / targetFps) return;
      lastTime = now;

      const t = clock.getElapsedTime();
      plane.material.uniforms.uTime.value = t;

      // drift particles
      const pos = particles.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i]   += Math.sin(t * 0.15 + i) * 0.0006;
        pos[i+1] += Math.cos(t * 0.12 + i) * 0.0005;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.z = t * 0.008;

      poly.rotation.x = t * 0.055;
      poly.rotation.y = t * 0.08;

      renderer.clear();
      renderer.render(scene, camera);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
      else if (!frame) { lastTime = performance.now(); tick(); }
    });
    tick();
  }

  // Three.js lazy-inits once loaded
  if (typeof THREE !== 'undefined') initShaderBg();
  else {
    const chk = setInterval(() => {
      if (typeof THREE !== 'undefined') { clearInterval(chk); initShaderBg(); }
    }, 80);
    setTimeout(() => clearInterval(chk), 6000);
  }

  // ─── Terminal typewriter effect ───
  const terminals = document.querySelectorAll('[data-typewriter]');
  if (terminals.length && 'IntersectionObserver' in window) {
    const to = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const text = el.dataset.typewriter;
        el.textContent = '';
        let i = 0;
        const speed = parseInt(el.dataset.speed || '22', 10);
        const step = () => {
          if (i >= text.length) return;
          el.textContent += text[i++];
          setTimeout(step, speed + Math.random() * 12);
        };
        step();
        to.unobserve(el);
      });
    }, { threshold: 0.6 });
    terminals.forEach(el => to.observe(el));
  }

})();
