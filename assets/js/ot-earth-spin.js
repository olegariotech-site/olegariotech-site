/* Digital Pulse prototype: daylight Earth morphs into a particle globe on desktop scroll. */
(() => {
  const earth = document.getElementById('earthJourney');
  const canvas = earth?.querySelector('.earth-journey__canvas');
  if (!earth || !canvas) return;

  const mobile = matchMedia('(max-width:900px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const canLoad = () => !mobile.matches && !reduced.matches && !navigator.connection?.saveData;
  let requested = false, ready = false, renderer, scene, camera, globeGroup, photoMaterial, particles, particleMaterial;
  let frame = 0, last = 0;
  const radiansPerMs = Math.PI * 2 / 42000; // One complete, seamless turn every 42 seconds.

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  }

  function pulseState(now) {
    const pulse = clamp(parseFloat(earth.dataset.pulse || '0') || 0);
    const spread = clamp(parseFloat(earth.dataset.spread || '0') || 0);
    if (photoMaterial) photoMaterial.opacity = 1 - pulse * .88;
    if (particleMaterial) {
      particleMaterial.uniforms.uTime.value = now * .001;
      particleMaterial.uniforms.uOpacity.value = pulse * .96;
      particleMaterial.uniforms.uSpread.value = spread;
    }
    if (particles) particles.visible = pulse > .015;
    earth.classList.toggle('is-pulse', pulse > .08);
  }

  function draw(now) {
    if (!frame) return;
    if (now - last >= 33) {
      const delta = last ? Math.min(80, now - last) : 33;
      globeGroup.rotation.y = (globeGroup.rotation.y + delta * radiansPerMs) % (Math.PI * 2);
      pulseState(now);
      renderer.render(scene, camera);
      last = now;
    }
    frame = requestAnimationFrame(draw);
  }

  function sync() {
    const enabled = ready && canLoad();
    earth.classList.toggle('is-spinning', enabled);
    if (enabled && earth.dataset.animate === 'true' && !document.hidden) {
      if (!frame) frame = requestAnimationFrame(draw);
    } else {
      earth.classList.remove('is-pulse');
      stop();
    }
  }

  function resize() {
    if (!ready) return;
    const size = Math.min(620, Math.max(280, Math.round(earth.clientWidth)));
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25));
    renderer.setSize(size, size, false);
    renderer.render(scene, camera);
  }

  function createParticleGlobe(image) {
    try {
      const sample = document.createElement('canvas');
      const width = 320, height = 160, step = 2;
      sample.width = width; sample.height = height;
      const ctx = sample.getContext('2d', {willReadFrequently:true});
      if (!ctx) return;
      ctx.drawImage(image, 0, 0, width, height);
      const pixels = ctx.getImageData(0, 0, width, height).data;
      const positions = [], phases = [];

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const i = (y * width + x) * 4;
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
          if (a < 20) continue;

          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          const luma = (r + g + b) / 3;
          const ocean = b > 72 && b > r * 1.14 && b > g * 1.04;
          const cloud = max - min < 18 && max > 188;
          let keep = !ocean && luma > 28;
          // Keep a very small amount of bright cloud structure so the globe does not look cut out.
          if (cloud) keep = ((x + y) % 10 === 0);
          if (!keep) continue;

          const u = x / (width - 1);
          const v = y / (height - 1);
          const lon = u * Math.PI * 2 - Math.PI;
          const lat = Math.PI / 2 - v * Math.PI;
          const radius = 1.012;
          const cosLat = Math.cos(lat);
          positions.push(
            radius * cosLat * Math.cos(lon),
            radius * Math.sin(lat),
            -radius * cosLat * Math.sin(lon)
          );
          phases.push((x * .173 + y * .311) % (Math.PI * 2));
        }
      }

      if (positions.length < 900) return;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));

      particleMaterial = new THREE.ShaderMaterial({
        transparent:true,
        depthWrite:false,
        blending:THREE.AdditiveBlending,
        uniforms:{
          uTime:{value:0},
          uOpacity:{value:0},
          uSpread:{value:0},
          uPointSize:{value:1.18},
          uColorA:{value:new THREE.Color(0x67e8f9)},
          uColorB:{value:new THREE.Color(0xa855f7)}
        },
        vertexShader:`
          attribute float aPhase;
          uniform float uTime;
          uniform float uOpacity;
          uniform float uSpread;
          uniform float uPointSize;
          varying float vAlpha;
          varying float vMix;
          void main(){
            vec3 normalDir = normalize(position);
            float breathe = sin(uTime * 1.25 + aPhase) * 0.006;
            float ripple = sin(uTime * 1.8 + position.y * 9.0 + position.x * 5.0) * 0.004;
            float burst = uSpread * (0.035 + 0.05 * sin(aPhase * 1.7 + uTime * 0.9));
            vec3 p = position + normalDir * (breathe + ripple + burst);
            float drift = uSpread * uSpread * 0.045 * sin(aPhase * 2.3 + uTime * 0.45);
            p += vec3(drift, drift * 0.35, -drift * 0.25);
            vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = uPointSize * (5.4 / max(1.0, -mvPosition.z));
            vAlpha = uOpacity * (0.78 + 0.22 * sin(aPhase + uTime * 0.25));
            vMix = clamp(position.y * 0.55 + 0.5, 0.0, 1.0);
          }
        `,
        fragmentShader:`
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          varying float vAlpha;
          varying float vMix;
          void main(){
            float d = distance(gl_PointCoord, vec2(0.5));
            if(d > 0.5) discard;
            float core = 1.0 - smoothstep(0.08, 0.34, d);
            float halo = 1.0 - smoothstep(0.18, 0.5, d);
            vec3 color = mix(uColorA, uColorB, vMix);
            gl_FragColor = vec4(color, (core * 0.88 + halo * 0.34) * vAlpha);
          }
        `
      });

      particles = new THREE.Points(geometry, particleMaterial);
      particles.frustumCulled = false;
      particles.visible = false;
      globeGroup.add(particles);
      document.documentElement.classList.add('has-digital-pulse');
    } catch (error) {
      particles = null;
      particleMaterial = null;
    }
  }

  function init() {
    try {
      renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'low-power'});
      renderer.setClearColor(0x000000, 0);
      renderer.outputEncoding = THREE.sRGBEncoding;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
      camera.position.z = 3.5;
      scene.add(new THREE.AmbientLight(0xffffff, .75));
      const sun = new THREE.DirectionalLight(0xe5f4ff, 1.05);
      sun.position.set(-2, 2.5, 4); scene.add(sun);
      const rim = new THREE.DirectionalLight(0x76c7ff, .35);
      rim.position.set(2, -1, -2); scene.add(rim);

      globeGroup = new THREE.Group();
      globeGroup.rotation.y = -Math.PI / 6; // The Americas face the visitor first.
      globeGroup.rotation.z = -.09;
      scene.add(globeGroup);

      new THREE.TextureLoader().load('/assets/img/orbit/nasa-blue-marble-map-2048.webp', texture => {
        texture.encoding = THREE.sRGBEncoding;
        photoMaterial = new THREE.MeshPhongMaterial({
          map:texture,
          shininess:3,
          specular:0x192c44,
          transparent:true,
          opacity:1
        });
        const photoSphere = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), photoMaterial);
        globeGroup.add(photoSphere);
        createParticleGlobe(texture.image);
        ready = true;
        resize();
        pulseState(performance.now());
        sync();
      }, undefined, () => {
        stop();
        renderer.dispose();
      });
    } catch (error) {
      stop();
      earth.classList.remove('is-spinning','is-pulse');
    }
  }

  function load() {
    if (requested || !canLoad()) return;
    requested = true;
    if (window.THREE) { init(); return; }
    const script = document.createElement('script');
    script.src = '/assets/js/vendor/three-r128.min.js';
    script.onload = init;
    document.head.appendChild(script);
  }

  earth.addEventListener('ot-earth-visibility', sync);
  document.addEventListener('visibilitychange', sync);
  addEventListener('resize', resize, {passive:true});
  mobile.addEventListener('change', () => {load(); sync();});
  reduced.addEventListener('change', () => {load(); sync();});
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    stop();
    earth.classList.remove('is-spinning','is-pulse');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    if (ready) { resize(); sync(); }
  });
  load();
})();
