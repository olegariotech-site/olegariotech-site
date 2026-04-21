/**
 * OT Background 3D — Inspirado em activetheory.net
 * Three.js: partículas duplas (azul bokeh + dourado cósmico) + anel holográfico + trilha de luz
 */
(function () {
  'use strict';

  // Carrega Three.js dinamicamente
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    s.onerror = function () { console.warn('Three.js CDN falhou, tentando fallback...'); };
    document.head.appendChild(s);
  }

  function init() {
    if (typeof THREE === 'undefined') return;

    var canvas = document.getElementById('bg-3d-canvas');
    if (!canvas) return;

    var isMobile = window.innerWidth < 768;
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // ── Renderer ──────────────────────────────────────────────────────────────
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !isMobile,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // ── Scene & Camera ────────────────────────────────────────────────────────
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // ── Mouse parallax ────────────────────────────────────────────────────────
    var mouse = { x: 0, y: 0 };
    var targetMouse = { x: 0, y: 0 };
    document.addEventListener('mousemove', function (e) {
      targetMouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    });

    // ── Partículas Azuis (Bokeh) ──────────────────────────────────────────────
    var blueCount = isMobile ? 180 : 350;
    var blueGeo = new THREE.BufferGeometry();
    var bluePos = new Float32Array(blueCount * 3);
    var blueSizes = new Float32Array(blueCount);

    for (var i = 0; i < blueCount; i++) {
      // Concentradas no lado esquerdo e espalhadas
      bluePos[i * 3]     = (Math.random() - 0.7) * 12;
      bluePos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      bluePos[i * 3 + 2] = (Math.random() - 0.5) * 6;
      blueSizes[i] = Math.random() * 0.06 + 0.01;
    }

    blueGeo.setAttribute('position', new THREE.BufferAttribute(bluePos, 3));
    blueGeo.setAttribute('size', new THREE.BufferAttribute(blueSizes, 1));

    var blueMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x4488ff) }
      },
      vertexShader: `
        attribute float size;
        uniform float uTime;
        varying float vAlpha;
        void main() {
          vec3 pos = position;
          pos.y += sin(uTime * 0.3 + position.x * 0.5) * 0.15;
          pos.x += cos(uTime * 0.2 + position.y * 0.4) * 0.1;
          vAlpha = 0.3 + 0.4 * abs(sin(uTime * 0.5 + position.z));
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = (1.0 - d * 2.0) * vAlpha;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    var blueParticles = new THREE.Points(blueGeo, blueMat);
    scene.add(blueParticles);

    // ── Partículas Douradas/Verdes (Cósmicas) ─────────────────────────────────
    var goldCount = isMobile ? 220 : 450;
    var goldGeo = new THREE.BufferGeometry();
    var goldPos = new Float32Array(goldCount * 3);
    var goldSizes = new Float32Array(goldCount);
    var goldColors = new Float32Array(goldCount * 3);

    for (var j = 0; j < goldCount; j++) {
      // Concentradas no lado direito inferior
      goldPos[j * 3]     = (Math.random() * 0.8) * 10 - 1;
      goldPos[j * 3 + 1] = (Math.random() - 0.8) * 8;
      goldPos[j * 3 + 2] = (Math.random() - 0.5) * 5;
      goldSizes[j] = Math.random() * 0.04 + 0.005;

      // Mix de dourado e verde
      var t = Math.random();
      goldColors[j * 3]     = 0.6 + t * 0.3;   // R
      goldColors[j * 3 + 1] = 0.5 + t * 0.4;   // G
      goldColors[j * 3 + 2] = t * 0.2;          // B
    }

    goldGeo.setAttribute('position', new THREE.BufferAttribute(goldPos, 3));
    goldGeo.setAttribute('size', new THREE.BufferAttribute(goldSizes, 1));
    goldGeo.setAttribute('color', new THREE.BufferAttribute(goldColors, 3));

    var goldMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        uniform float uTime;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vec3 pos = position;
          pos.y += sin(uTime * 0.4 + position.x * 0.8) * 0.2;
          pos.x += cos(uTime * 0.25 + position.z * 0.6) * 0.12;
          vAlpha = 0.4 + 0.5 * abs(sin(uTime * 0.6 + position.y * 2.0));
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (280.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = (1.0 - d * 2.0) * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    var goldParticles = new THREE.Points(goldGeo, goldMat);
    scene.add(goldParticles);

    // ── Anel Holográfico Central ───────────────────────────────────────────────
    var ringGroup = new THREE.Group();
    ringGroup.position.set(0.3, 0.2, 0);

    // Anel externo
    var ringOuterGeo = new THREE.TorusGeometry(0.9, 0.025, 16, 120);
    var ringOuterMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          float angle = vUv.x * 6.2831 + uTime * 0.5;
          vec3 col1 = vec3(0.1, 0.4, 1.0);   // azul
          vec3 col2 = vec3(0.6, 0.1, 0.9);   // roxo
          vec3 col3 = vec3(1.0, 0.4, 0.1);   // laranja
          vec3 col4 = vec3(0.1, 0.9, 0.5);   // verde
          float t = mod(angle / 6.2831, 1.0);
          vec3 color;
          if (t < 0.25) color = mix(col1, col2, t * 4.0);
          else if (t < 0.5) color = mix(col2, col3, (t - 0.25) * 4.0);
          else if (t < 0.75) color = mix(col3, col4, (t - 0.5) * 4.0);
          else color = mix(col4, col1, (t - 0.75) * 4.0);
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          float alpha = 0.7 + fresnel * 0.3;
          gl_FragColor = vec4(color * (1.5 + fresnel), alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var ringOuter = new THREE.Mesh(ringOuterGeo, ringOuterMat);
    ringGroup.add(ringOuter);

    // Anel interno (menor, mais brilhante)
    var ringInnerGeo = new THREE.TorusGeometry(0.55, 0.012, 12, 80);
    var ringInnerMat = new THREE.MeshBasicMaterial({
      color: 0x88aaff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var ringInner = new THREE.Mesh(ringInnerGeo, ringInnerMat);
    ringInner.rotation.x = Math.PI * 0.15;
    ringGroup.add(ringInner);

    // Símbolo "OT" no centro do anel (icosaedro como placeholder do logo)
    var coreGeo = new THREE.IcosahedronGeometry(0.22, 1);
    var coreMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPos;
        void main() {
          vec3 baseColor = vec3(0.05, 0.1, 0.3);
          vec3 glowColor = vec3(0.2, 0.5, 1.0);
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
          float pulse = 0.5 + 0.5 * sin(uTime * 1.2);
          vec3 color = mix(baseColor, glowColor, fresnel * (0.8 + pulse * 0.4));
          gl_FragColor = vec4(color, 0.85 + fresnel * 0.15);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    var core = new THREE.Mesh(coreGeo, coreMat);
    ringGroup.add(core);

    // Glow atrás do anel
    var glowGeo = new THREE.PlaneGeometry(2.8, 2.8);
    var glowMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vec2 center = vUv - 0.5;
          float d = length(center);
          float pulse = 0.5 + 0.5 * sin(uTime * 0.8);
          float glow = exp(-d * 4.0) * (0.15 + pulse * 0.08);
          vec3 color = mix(vec3(0.1, 0.2, 0.8), vec3(0.4, 0.1, 0.7), pulse);
          gl_FragColor = vec4(color, glow);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.z = -0.1;
    ringGroup.add(glow);

    scene.add(ringGroup);

    // ── Cone/Pirâmide Metálica (objeto secundário) ─────────────────────────────
    var coneGeo = new THREE.ConeGeometry(0.18, 0.38, 4);
    var coneMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
          vec3 color = mix(vec3(0.05, 0.15, 0.35), vec3(0.3, 0.7, 1.0), fresnel);
          float pulse = 0.5 + 0.5 * sin(uTime * 1.5 + 1.0);
          gl_FragColor = vec4(color * (0.8 + pulse * 0.4), 0.75 + fresnel * 0.25);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    var cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(-0.55, -0.15, 0.1);
    cone.rotation.z = Math.PI * 0.05;
    scene.add(cone);

    // ── Trilha de Luz Curvada ─────────────────────────────────────────────────
    var trailPoints = [];
    for (var k = 0; k <= 80; k++) {
      var t2 = k / 80;
      var x = 0.3 + Math.sin(t2 * Math.PI * 1.5) * 1.2;
      var y = 0.2 - t2 * 3.5;
      var z = Math.cos(t2 * Math.PI) * 0.3;
      trailPoints.push(new THREE.Vector3(x, y, z));
    }

    var trailCurve = new THREE.CatmullRomCurve3(trailPoints);
    var trailGeo = new THREE.TubeGeometry(trailCurve, 100, 0.008, 6, false);
    var trailMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          float t = vUv.x;
          float alpha = (1.0 - t) * 0.7 * (0.5 + 0.5 * sin(uTime * 2.0 - t * 8.0));
          vec3 col1 = vec3(0.2, 0.5, 1.0);
          vec3 col2 = vec3(0.5, 0.2, 0.9);
          vec3 color = mix(col1, col2, t);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    var trail = new THREE.Mesh(trailGeo, trailMat);
    scene.add(trail);

    // ── Pontos de luz na trilha ───────────────────────────────────────────────
    var trailDotCount = 12;
    var trailDotGeo = new THREE.BufferGeometry();
    var trailDotPos = new Float32Array(trailDotCount * 3);
    var trailDotSizes = new Float32Array(trailDotCount);
    var trailCurvePoints = trailCurve.getPoints(trailDotCount - 1);

    for (var m = 0; m < trailDotCount; m++) {
      trailDotPos[m * 3]     = trailCurvePoints[m].x;
      trailDotPos[m * 3 + 1] = trailCurvePoints[m].y;
      trailDotPos[m * 3 + 2] = trailCurvePoints[m].z;
      trailDotSizes[m] = 0.03 + (1 - m / trailDotCount) * 0.04;
    }

    trailDotGeo.setAttribute('position', new THREE.BufferAttribute(trailDotPos, 3));
    trailDotGeo.setAttribute('size', new THREE.BufferAttribute(trailDotSizes, 1));

    var trailDotMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float size;
        uniform float uTime;
        varying float vIdx;
        void main() {
          vIdx = float(gl_VertexID) / 12.0;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying float vIdx;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = (1.0 - d * 2.0) * (1.0 - vIdx) * (0.5 + 0.5 * sin(uTime * 3.0 + vIdx * 5.0));
          vec3 color = mix(vec3(0.3, 0.6, 1.0), vec3(0.6, 0.3, 1.0), vIdx);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    var trailDots = new THREE.Points(trailDotGeo, trailDotMat);
    scene.add(trailDots);

    // ── Resize ────────────────────────────────────────────────────────────────
    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ── Animation Loop ────────────────────────────────────────────────────────
    var clock = new THREE.Clock();
    var animId;

    function animate() {
      animId = requestAnimationFrame(animate);
      var t = clock.getElapsedTime();

      // Suaviza mouse
      mouse.x += (targetMouse.x - mouse.x) * 0.04;
      mouse.y += (targetMouse.y - mouse.y) * 0.04;

      // Parallax na câmera
      camera.position.x = mouse.x * 0.3;
      camera.position.y = mouse.y * 0.2;
      camera.lookAt(0, 0, 0);

      // Atualiza uniforms
      blueMat.uniforms.uTime.value = t;
      goldMat.uniforms.uTime.value = t;
      ringOuterMat.uniforms.uTime.value = t;
      coreMat.uniforms.uTime.value = t;
      glowMat.uniforms.uTime.value = t;
      coneMat.uniforms.uTime.value = t;
      trailMat.uniforms.uTime.value = t;
      trailDotMat.uniforms.uTime.value = t;

      // Rotação do anel
      ringGroup.rotation.y = t * 0.15;
      ringGroup.rotation.x = Math.sin(t * 0.2) * 0.1;
      ringOuter.rotation.z = t * 0.4;
      ringInner.rotation.y = -t * 0.6;
      core.rotation.y = t * 0.5;
      core.rotation.x = t * 0.3;

      // Flutuação do cone
      cone.position.y = -0.15 + Math.sin(t * 0.7) * 0.08;
      cone.rotation.y = t * 0.4;

      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('beforeunload', function () {
      cancelAnimationFrame(animId);
      renderer.dispose();
    });
  }

  // Carrega Three.js e inicializa
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js', function () {
    // Aguarda DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  });

})();
