/* A daylight Earth rotates only where the scroll journey is visible on desktop. */
(() => {
  const earth = document.getElementById('earthJourney');
  const canvas = earth?.querySelector('.earth-journey__canvas');
  if (!earth || !canvas) return;

  const mobile = matchMedia('(max-width:900px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const canLoad = () => !mobile.matches && !reduced.matches && !navigator.connection?.saveData;
  let requested = false, ready = false, renderer, scene, camera, globe;
  let frame = 0, last = 0;
  const radiansPerMs = Math.PI * 2 / 42000; // One complete, seamless turn every 42 seconds.

  function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; last = 0; }
  function draw(now) {
    if (!frame) return;
    if (now - last >= 33) {
      globe.rotation.y = (globe.rotation.y + (last ? Math.min(80, now - last) : 33) * radiansPerMs) % (Math.PI * 2);
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
    } else stop();
  }
  function resize() {
    if (!ready) return;
    const size = Math.min(600, Math.max(280, Math.round(earth.clientWidth)));
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25));
    renderer.setSize(size, size, false);
    renderer.render(scene, camera);
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
      new THREE.TextureLoader().load('/assets/img/orbit/nasa-blue-marble-map-2048.webp', texture => {
        texture.encoding = THREE.sRGBEncoding;
        globe = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.MeshPhongMaterial({map:texture, shininess:3, specular:0x192c44}));
        globe.rotation.y = -Math.PI / 6; // The Americas face the visitor first.
        globe.rotation.z = -.09;
        scene.add(globe);
        ready = true;
        resize();
        sync();
      }, undefined, () => { stop(); renderer.dispose(); });
    } catch (error) { stop(); earth.classList.remove('is-spinning'); }
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
  canvas.addEventListener('webglcontextlost', event => {event.preventDefault();stop();earth.classList.remove('is-spinning');});
  canvas.addEventListener('webglcontextrestored', () => {if (ready) {resize();sync();}});
  load();
})();
