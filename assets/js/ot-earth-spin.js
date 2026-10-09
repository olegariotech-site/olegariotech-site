/* A single renderer: photographic Earth -> continental points -> a perspective wave.
   The same particles travel between shapes. 2D preserves the story when WebGL is unavailable. */
(() => {
  'use strict';
  const earth = document.getElementById('earthJourney');
  let canvas = earth?.querySelector('.earth-journey__canvas');
  if (!earth || !canvas) return;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const compact = matchMedia('(max-width:900px)');
  const memory = Number(navigator.deviceMemory || 8);
  const lite = !!navigator.connection?.saveData || memory <= 4 || compact.matches;
  const frameMs = lite ? 50 : 33;
  const clamp = v => Math.min(1, Math.max(0, v));
  let continuation = null;
  const state = () => continuation || ({
    pulse: +earth.dataset.pulse || 0, morph: +earth.dataset.morph || 0,
    opacity: +earth.dataset.opacity || 0, x: +earth.dataset.centerX || innerWidth * .78,
    y: +earth.dataset.centerY || innerHeight * .5, diameter: +earth.dataset.diameter || 540,
    rail: +earth.dataset.rail || 0
  });
  let frame = 0, last = 0, angle = -Math.PI / 6, mode = '', requested = false;
  let renderer, scene, camera, photo, points, material, atmosphere, cityLights;
  let ctx, fallbackPhoto, fallbackSurface, fallbackPoints = [];
  const fallbackFrames = new Map();
  let disposed = false;
  const textureURL = '/assets/img/orbit/nasa-blue-marble-clouds-2048.webp';

  function sample(image, width = 384, height = 192, step = 2) {
    const buffer = document.createElement('canvas');
    buffer.width = width; buffer.height = height;
    const context = buffer.getContext('2d', {willReadFrequently:true});
    if (!context) return [];
    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const result = [];
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const offset = (y * width + x) * 4;
        const r = pixels[offset], g = pixels[offset + 1], b = pixels[offset + 2];
        const ocean = b > r * 1.14 && b > g * 1.04;
        const cloud = Math.max(r,g,b) - Math.min(r,g,b) < 18 && r > 188;
        if (ocean && (x + y * 3) % 14 !== 0) continue;
        if (cloud && (x + y) % 8 !== 0) continue;
        const lon = x / width * Math.PI * 2 - Math.PI;
        const lat = Math.PI * .5 - y / height * Math.PI;
        result.push([Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon), (x * .173 + y * .311) % (Math.PI * 2)]);
      }
    }
    return result;
  }
  function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; last = 0; }
  function run(now) {
    if (!frame || disposed) return;
    if (now - last >= frameMs) {
      const delta = last ? Math.min(now - last, 100) : frameMs;
      angle = (angle + delta * Math.PI * 2 / 42000) % (Math.PI * 2);
      draw(now);
      last = now;
    }
    frame = requestAnimationFrame(run);
  }
  function sync() {
    if (!mode) return;
    const enabled = !reduced.matches && (continuation?.animate || earth.dataset.animate === 'true') && !document.hidden;
    if (enabled) { if (!frame) frame = requestAnimationFrame(run); }
    else { stop(); draw(performance.now()); }
  }
  function resize() {
    if (mode === 'webgl') {
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lite ? 1 : 1.4));
      renderer.setSize(innerWidth, innerHeight, false);
      const worldHeight = 2 * Math.tan(Math.PI / 9) * 6;
      camera.left = -worldHeight * innerWidth / innerHeight * .5;
      camera.right = -camera.left; camera.top = worldHeight * .5; camera.bottom = -camera.top;
      camera.updateProjectionMatrix();
    } else if (ctx) {
      const ratio = Math.min(devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(innerWidth * ratio); canvas.height = Math.round(innerHeight * ratio);
      ctx.setTransform(ratio,0,0,ratio,0,0);
    }
    if (mode) draw(performance.now());
  }
  function draw(now) {
    const s = state();
    if (mode === 'webgl') {
      const worldHeight = 2 * Math.tan(Math.PI / 9) * 6;
      const unit = worldHeight / innerHeight;
      const radius = s.diameter * .5 * unit;
      const anchorX = (s.x - innerWidth * .5) * unit;
      const anchorY = (innerHeight * .5 - s.y) * unit;
      photo.position.set(anchorX, anchorY, 0);
      photo.scale.setScalar(radius);
      photo.rotation.y = angle; photo.rotation.z = -.09;
      photo.material.opacity = (1 - s.pulse) * (1 - s.morph);
      photo.visible = photo.material.opacity > .005;
      if(cityLights){cityLights.position.copy(photo.position);cityLights.scale.setScalar(radius*1.001);cityLights.rotation.copy(photo.rotation);cityLights.material.uniforms.uOpacity.value=photo.material.opacity;cityLights.visible=photo.visible;}
      atmosphere.position.copy(photo.position); atmosphere.scale.setScalar(radius * 1.018);
      atmosphere.visible = s.morph < .25;
      atmosphere.material.uniforms.uOpacity.value = (1 - s.morph) * 1.2;
      material.uniforms.uTime.value = now * .001;
      material.uniforms.uRotation.value = angle;
      material.uniforms.uRadius.value = radius;
      material.uniforms.uAnchor.value.set(anchorX,anchorY,0);
      material.uniforms.uWaveWidth.value = (innerWidth - s.rail) * unit * 1.22;
      material.uniforms.uWaveCenter.value = s.rail * .5 * unit;
      material.uniforms.uWaveY.value = -worldHeight * .16;
      material.uniforms.uMorph.value = s.morph;
      material.uniforms.uOpacity.value = s.pulse;
      renderer.render(scene,camera);
    } else if (ctx) draw2D(now,s);
  }
  function draw2D(now,s) {
    const w = innerWidth, h = innerHeight, time = now * .001;
    ctx.clearRect(0,0,w,h);
    const radius = s.diameter * .5;
    const continuedPhoto=continuation?fallbackSphere():null;
    if ((continuedPhoto||fallbackPhoto) && s.pulse < 1) {
      ctx.globalAlpha = (1 - s.pulse) * (1 - s.morph);
      ctx.save();
      ctx.beginPath(); ctx.arc(s.x,s.y,radius*.98,0,Math.PI*2); ctx.clip();
      ctx.filter = 'none';
      ctx.drawImage(continuedPhoto||fallbackPhoto,s.x-radius,s.y-radius,s.diameter,s.diameter);
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'lighter';
    const count = fallbackPoints.length;
    const columns = Math.ceil(Math.sqrt(count * 1.85));
    const rows = Math.ceil(count / columns);
    for (let i = 0; i < count; i++) {
      const p = fallbackPoints[i];
      const x = p[0] * Math.cos(angle) + p[2] * Math.sin(angle);
      const z = -p[0] * Math.sin(angle) + p[2] * Math.cos(angle);
      const u = (i % columns) / Math.max(1,columns-1), v = Math.floor(i/columns)/Math.max(1,rows-1);
      const waveX = s.rail + (w-s.rail) * (-.12 + u*1.24);
      const depth = .35 + v*.65;
      const waveY = h*.53 + v*h*.43 + Math.sin(u*10+time*.65+v*5)*h*.065*depth + Math.cos(u*17-v*8+time*.4)*h*.022;
      const px = s.x + x*radius*(1-s.morph) + (waveX-s.x)*s.morph;
      const py = s.y - p[1]*radius*(1-s.morph) + (waveY-s.y)*s.morph;
      const alpha = s.pulse * ((1-s.morph)*Math.max(0,z*.6+.3) + s.morph*(.22+depth*.5));
      if (alpha < .01) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = v > .62 ? '#a78bfa' : '#67e8f9';
      const size = (lite ? 1.1 : 1.35) * (.7 + depth*.5);
      ctx.fillRect(px,py,size,size);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  // Only continuation poses use this spherical fallback. Original HERO stays identical.
  function fallbackSphere(){
    if(!fallbackSurface)return null;
    const step=Math.round(angle*32/(Math.PI*2));
    if(fallbackFrames.has(step))return fallbackFrames.get(step);
    const size=lite?112:176,c=document.createElement('canvas');c.width=c.height=size;
    const g=c.getContext('2d'),out=g.createImageData(size,size),src=fallbackSurface;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const nx=(x+.5)/size*2-1,ny=1-(y+.5)/size*2,d=nx*nx+ny*ny;if(d>1)continue;
      const z=Math.sqrt(1-d),lon=Math.atan2(nx,z)+step/32*Math.PI*2;
      const u=((lon/Math.PI/2+.5)%1+1)%1,v=Math.acos(ny)/Math.PI;
      const k=(Math.min(127,Math.floor(v*128))*256+Math.floor(u*256))*4,i=(y*size+x)*4;
      const light=.3+.7*Math.max(0,nx*.38+ny*.55+z*.75),rim=.5+.5*Math.sqrt(z);
      out.data[i]=src.data[k]*light*rim;out.data[i+1]=src.data[k+1]*light*rim;out.data[i+2]=src.data[k+2]*light*rim;out.data[i+3]=255;
    }
    g.putImageData(out,0,0);if(fallbackFrames.size>=6)fallbackFrames.delete(fallbackFrames.keys().next().value);fallbackFrames.set(step,c);return c;
  }
  function fallback() {
    if (renderer) renderer.dispose();
    const replacement = document.createElement('canvas');
    replacement.className = canvas.className; replacement.setAttribute('aria-hidden','true');
    canvas.replaceWith(replacement); canvas = replacement;
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    const map = new Image();
    map.onload = () => {
      try{const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(map,0,0,256,128);fallbackSurface=g.getImageData(0,0,256,128);}catch{fallbackSurface=null;}
      try { fallbackPoints = sample(map,192,96,2); } catch { fallbackPoints = []; }
      // A deterministic surface still works if texture sampling is unavailable.
      if (!fallbackPoints.length) for(let i=0;i<1200;i++) {
        const lat = Math.acos(1 - 2*(i+.5)/1200), lon = i*2.399963;
        fallbackPoints.push([Math.sin(lat)*Math.cos(lon),Math.cos(lat),Math.sin(lat)*Math.sin(lon),lon]);
      }
      const image = new Image();
      image.onload = () => { fallbackPhoto = image; mode='canvas2d'; earth.dataset.renderer=mode; earth.classList.add('is-rendering'); resize(); sync(); };
      image.onerror = () => { mode='canvas2d'; earth.dataset.renderer=mode; earth.classList.add('is-rendering'); resize(); sync(); };
      image.src='/assets/img/orbit/ot-earth-atmosphere-static-v2.webp';
    };
    map.onerror = () => { /* CSS image remains readable if the map cannot load. */ };
    map.src=textureURL;
  }
  function init() {
    try {
      const context = canvas.getContext('webgl2', {alpha:true,antialias:!lite,powerPreference:'low-power'}) || canvas.getContext('webgl', {alpha:true,antialias:!lite,powerPreference:'low-power'});
      if (!context) { fallback(); return; }
      renderer = new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:!lite,powerPreference:'low-power'});
      renderer.setClearColor(0x000000,0); renderer.outputEncoding=THREE.sRGBEncoding;
      scene = new THREE.Scene(); camera = new THREE.OrthographicCamera(-1,1,1,-1,.1,100); camera.position.z=6;
      scene.add(new THREE.AmbientLight(0x6498ef,.2));
      const sun = new THREE.DirectionalLight(0xd1eaff,1.55); sun.position.set(3,5,2); scene.add(sun);
      new THREE.TextureLoader().load(textureURL, texture => {
        try {
          texture.encoding=THREE.sRGBEncoding;
          photo = new THREE.Mesh(new THREE.SphereGeometry(1,64,48),new THREE.MeshPhongMaterial({map:texture,transparent:true,shininess:14,specular:0x174470,depthWrite:false}));
          scene.add(photo);
          new THREE.TextureLoader().load('/assets/img/orbit/nasa-city-lights-2048.webp',lights=>{
            if(disposed){lights.dispose();return;}
            cityLights=new THREE.Mesh(new THREE.SphereGeometry(1,64,48),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uLights:{value:lights},uOpacity:{value:1}},vertexShader:'varying vec2 vUv; varying vec3 vNormal; void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D uLights;uniform float uOpacity;varying vec2 vUv;varying vec3 vNormal;void main(){vec3 tex=texture2D(uLights,vUv).rgb;float intensity=max(tex.r,max(tex.g,tex.b));float cities=smoothstep(.27,.78,intensity);float night=1.-smoothstep(-.2,.75,dot(normalize(vNormal),normalize(vec3(3.,5.,2.))));gl_FragColor=vec4(1.,.72,.34,cities*(.18+night*.82)*uOpacity);}' }));scene.add(cityLights);draw(performance.now());
          });
          atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1,40,24),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.AdditiveBlending,uniforms:{uOpacity:{value:.24}},vertexShader:'varying vec3 vNormal; varying vec3 vView; void main(){vec4 p=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'uniform float uOpacity; varying vec3 vNormal; varying vec3 vView; void main(){float rim=pow(1.-abs(dot(vNormal,vView)),3.);gl_FragColor=vec4(.28,.70,1.,rim*uOpacity);}'}));
          scene.add(atmosphere);
          const data = sample(texture.image,lite?256:512,lite?128:256,2);
          if (!data.length) throw new Error('Empty Earth texture');
          const positions=[], targets=[], phases=[];
          const cols=Math.ceil(Math.sqrt(data.length*1.8)), rows=Math.ceil(data.length/cols);
          data.forEach((p,i)=>{positions.push(p[0],p[1],p[2]);phases.push(p[3]);targets.push((i%cols)/Math.max(1,cols-1)-.5,Math.floor(i/cols)/Math.max(1,rows-1));});
          const geometry=new THREE.BufferGeometry();
          geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
          geometry.setAttribute('aTarget',new THREE.Float32BufferAttribute(targets,2));
          geometry.setAttribute('aPhase',new THREE.Float32BufferAttribute(phases,1));
          material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uRotation:{value:angle},uRadius:{value:1},uAnchor:{value:new THREE.Vector3()},uMorph:{value:0},uOpacity:{value:0},uWaveWidth:{value:6},uWaveCenter:{value:0},uWaveY:{value:-1}},vertexShader:`
            attribute vec2 aTarget; attribute float aPhase;
            uniform float uTime,uRotation,uRadius,uMorph,uOpacity,uWaveWidth,uWaveCenter,uWaveY;
            uniform vec3 uAnchor; varying float vAlpha,vColor;
            void main(){
              float c=cos(uRotation),s=sin(uRotation);
              vec3 globe=vec3(position.x*c+position.z*s,position.y,-position.x*s+position.z*c);
              float breath=sin(aPhase+uTime*.8)*.009;
              globe=globe*(uRadius+breath)+uAnchor;
              float x=aTarget.x*uWaveWidth;
              float y=sin(x*1.7+uTime*.65+aTarget.y*3.)*.26+cos(x*2.7-aTarget.y*5.+uTime*.35)*.09;
              vec3 wave=vec3(x+uWaveCenter,uWaveY+y-aTarget.y*.65,(aTarget.y-.5)*4.2);
              vec3 p=mix(globe,wave,uMorph);
              vec4 mv=modelViewMatrix*vec4(p,1.);
              gl_Position=projectionMatrix*mv;
              gl_PointSize=clamp(1.9*(6./max(1.,-mv.z)),.7,3.8);
              float edge=smoothstep(0.,.08,aTarget.x+.5)*(1.-smoothstep(.92,1.,aTarget.x+.5));
              float front=clamp((-position.x*s+position.z*c)*.7+.35,.08,1.);
              vAlpha=uOpacity*mix(front,edge*(.38+aTarget.y*.5),uMorph);
              vColor=mix(position.y*.45+.5,aTarget.y,uMorph);
            }`,fragmentShader:`
              varying float vAlpha,vColor;
              void main(){float d=distance(gl_PointCoord,vec2(.5));if(d>.5)discard;
              float a=(1.-smoothstep(.05,.5,d))*vAlpha;
              vec3 color=mix(vec3(.40,.91,.98),vec3(.66,.43,.96),clamp(vColor,0.,1.));
              gl_FragColor=vec4(color,a);}
            `});
          points=new THREE.Points(geometry,material); points.frustumCulled=false; scene.add(points);
          mode='webgl'; earth.dataset.renderer=mode; earth.dataset.particleCount=String(data.length);
          earth.classList.add('is-rendering'); resize(); sync();
        } catch { fallback(); }
      },undefined,fallback);
    } catch { fallback(); }
  }
  function load() {
    if (requested || reduced.matches) return;
    requested=true;
    if (window.THREE) { init(); return; }
    const script=document.createElement('script'); script.src='/assets/js/vendor/three-r128.min.js';
    script.onload=init; script.onerror=fallback; document.head.appendChild(script);
  }
  earth.addEventListener('ot-earth-continuum',event=>{
    // Dataset remains owned by the original timeline. Do not rewrite its hero values.
    const p=Number(earth.dataset.opacity)<.005?event.detail:null;
    continuation=p?{...p,pulse:0,morph:0,rail:0}:null;
    earth.classList.toggle('is-continuum',!!continuation);
    earth.style.setProperty('--continuum-opacity',String(p?.opacity||0));
    sync();
  });
  earth.addEventListener('ot-earth-visibility',()=>{
    if(Number(earth.dataset.opacity)>.005){continuation=null;earth.classList.remove('is-continuum');}
    sync();
  });
  addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',()=>{load();sync();});
  compact.addEventListener('change',resize);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();stop();mode='';earth.classList.remove('is-rendering');fallback();});
  addEventListener('pagehide',()=>{disposed=true;stop();renderer?.dispose();points?.geometry.dispose();material?.dispose();photo?.geometry.dispose();photo?.material.map?.dispose();photo?.material.dispose();atmosphere?.geometry.dispose();atmosphere?.material.dispose();cityLights?.geometry.dispose();cityLights?.material.uniforms.uLights.value.dispose();cityLights?.material.dispose();});
  addEventListener('pageshow',event=>{if(event.persisted){disposed=false;location.reload();}});
  load();
})();
