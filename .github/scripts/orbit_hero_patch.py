from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')

css = r'''

    /* ORBIT HERO V2 — Canvas 2D integrado à narrativa comercial */
    .hero-orbit{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;isolation:isolate;mask-image:radial-gradient(circle at 76% 48%,#000 0%,#000 45%,transparent 79%);-webkit-mask-image:radial-gradient(circle at 76% 48%,#000 0%,#000 45%,transparent 79%)}
    .hero-orbit::before{content:'';position:absolute;inset:8% -6% 2% 42%;background:radial-gradient(circle at 62% 48%,rgba(103,232,249,.13),rgba(168,85,247,.07) 34%,transparent 68%);filter:blur(14px);opacity:.9}
    .hero-orbit canvas{position:absolute;top:50%;right:-3.5vw;transform:translateY(-50%);width:min(760px,57vw);height:auto;aspect-ratio:1;display:block;opacity:.96;filter:drop-shadow(0 0 72px rgba(103,232,249,.17));will-change:transform}
    .orbit-hud{position:absolute;top:104px;right:max(28px,calc((100vw - var(--w))/2));font-family:'Share Tech Mono',monospace;font-size:.66rem;letter-spacing:.13em;color:rgba(164,171,196,.58);text-transform:uppercase;text-align:right;line-height:1.72;text-shadow:0 0 18px rgba(5,0,8,.9)}
    .orbit-hud b{color:var(--ice);font-weight:400}.orbit-hud i{color:var(--amber);font-style:normal}.orbit-hud .orbit-live{display:inline-flex;align-items:center;gap:7px}.orbit-hud .orbit-live::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 13px rgba(37,211,102,.8)}
    .hero-sticky::before{background:radial-gradient(ellipse 62% 84% at 18% 50%,rgba(5,0,8,.96),rgba(5,0,8,.64) 45%,transparent 74%)}
    .hero-grid{grid-template-columns:minmax(0,1.12fr) minmax(340px,.88fr);gap:clamp(34px,4vw,62px)}
    .hero-content{position:relative;z-index:8}
    .hero-summary-card{position:relative;z-index:8;justify-self:end;align-self:end;width:min(410px,100%);padding:22px 22px 18px;background:linear-gradient(145deg,rgba(11,7,30,.70),rgba(7,5,20,.88));border-color:rgba(103,232,249,.16);box-shadow:0 26px 78px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.04);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
    .hero-summary-card .summary-kicker{font-size:.62rem}.hero-summary-card h2{font-size:clamp(1.12rem,1.5vw,1.48rem);line-height:1.15}.hero-summary-card .summary-lead{font-size:.82rem;line-height:1.48;margin-bottom:13px}.hero-summary-card .summary-grid{gap:8px}.hero-summary-card .summary-grid>div{padding:11px}.hero-summary-card .summary-grid strong{font-size:.78rem}.hero-summary-card .summary-grid p{font-size:.7rem;line-height:1.35}.hero-summary-card .summary-actions{gap:8px}.hero-summary-card .summary-actions .btn{min-height:40px;padding:0 14px;font-size:.75rem}.hero-summary-card .summary-foot{font-size:.63rem;margin-top:10px}
    @media(max-height:800px) and (min-width:901px){.hero-sticky{padding-top:94px;padding-bottom:34px}.htitle{font-size:clamp(2.35rem,4vw,3.75rem);margin-bottom:16px}.hbadge{margin-bottom:16px}.hsub{font-size:.96rem;line-height:1.58;margin-bottom:13px}.hero-chips{margin-bottom:18px}.hact{margin-bottom:20px}.hero-summary-card{padding:16px 17px 14px;max-width:380px}.hero-summary-card .summary-lead,.hero-summary-card .summary-foot,.hero-summary-card .summary-grid p{display:none}.hero-summary-card .summary-grid{grid-template-columns:repeat(2,minmax(0,1fr));margin:10px 0}.hero-summary-card .summary-grid>div{min-height:58px}.hero-orbit canvas{width:min(650px,52vw)}.orbit-hud{top:88px}}
    @media(max-width:900px){.hero-orbit{opacity:.5;mask-image:radial-gradient(circle at 50% 69%,#000 0%,#000 38%,transparent 73%);-webkit-mask-image:radial-gradient(circle at 50% 69%,#000 0%,#000 38%,transparent 73%)}.hero-orbit::before{inset:40% -8% -8%;background:radial-gradient(circle at 50% 70%,rgba(103,232,249,.12),rgba(168,85,247,.06) 38%,transparent 72%)}.hero-orbit canvas{right:auto;left:50%;top:auto;bottom:-22%;transform:translateX(-50%);width:min(560px,118vw);opacity:.78}.orbit-hud{display:none}.hero-grid{grid-template-columns:1fr}.hero-content{z-index:9}.hero-summary-card{justify-self:stretch;width:100%;margin-top:20px;background:rgba(7,5,20,.82)}}
    @media(max-width:640px){.hero-orbit{opacity:.38}.hero-orbit canvas{bottom:-13%;width:min(500px,132vw)}.hero-summary-card{padding:20px}.hero-summary-card .summary-grid{grid-template-columns:1fr 1fr}.hero-summary-card .summary-grid p{display:none}}
    @media(prefers-reduced-motion:reduce){.hero-orbit canvas{will-change:auto}.orbit-hud .orbit-live::before{box-shadow:none}}
'''

html = r'''
          <div class="hero-orbit" aria-hidden="true">
            <canvas id="otGlobe" width="900" height="900"></canvas>
            <div class="orbit-hud">
              <div>ORBIT · OLEGARIO TECH</div>
              <div>OPERAÇÃO · <b id="otClock">--:--:--</b> BRT</div>
              <div>BASE · <i>VALINHOS/SP</i></div>
              <div class="orbit-live">SINAL COMERCIAL · <b>ATIVO</b></div>
              <div>CANAIS · SITE + IA + WHATSAPP</div>
            </div>
          </div>
'''

js = r'''

    /* Orbit Hero V2 — Canvas 2D leve, sincronizado ao heroScroll existente */
    function orbitHeroCanvas(){
      const canvas=document.getElementById('otGlobe');
      const hero=document.querySelector('.hero-scroll');
      if(!canvas||!hero)return;
      const ctx=canvas.getContext('2d',{alpha:true});
      if(!ctx)return;
      const W=canvas.width,H=canvas.height,cx=W/2,cy=H/2,R=W*.345;
      const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
      const pins=[
        {la:-22.97,lo:-46.99,label:'VALINHOS',color:'#f59e0b'},
        {la:-22.90,lo:-47.06,label:'CAMPINAS',color:'#67e8f9'},
        {la:-23.55,lo:-46.63,label:'SÃO PAULO',color:'#c084fc'},
        {la:-22.73,lo:-47.33,label:'INDAIATUBA',color:'#67e8f9'},
        {la:-23.20,lo:-46.88,label:'JUNDIAÍ',color:'#c084fc'}
      ];
      const sats=[{r:R*1.14,s:.34,a:0},{r:R*1.31,s:-.24,a:1.7},{r:R*1.47,s:.18,a:3.1}];
      let raf=0,visible=true,last=0,elapsed=0;
      window.otOrbitProgress=window.otOrbitProgress||0;
      function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
      function project(la,lo,rot){
        const lat=la*Math.PI/180,lng=(lo+rot)*Math.PI/180;
        const x=Math.cos(lat)*Math.sin(lng),y=-Math.sin(lat),z=Math.cos(lat)*Math.cos(lng);
        return{x:cx+x*R,y:cy+y*R,z};
      }
      function lineSphere(points,rot){
        ctx.beginPath();let drawing=false;
        points.forEach(([la,lo])=>{const p=project(la,lo,rot);if(p.z>-.02){drawing?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);drawing=true}else drawing=false});
        ctx.stroke();
      }
      function draw(ts){
        if(!visible||document.hidden){raf=0;return}
        const dt=last?Math.min(.05,(ts-last)/1000):0;last=ts;if(!reduce)elapsed+=dt;
        const progress=clamp(window.otOrbitProgress||0,0,1);
        const rot=progress*148+elapsed*4.2;
        const active=Math.min(pins.length-1,Math.floor(progress*pins.length));
        const satelliteAlpha=clamp((progress-.08)/.28,0,1);
        ctx.clearRect(0,0,W,H);
        const halo=ctx.createRadialGradient(cx,cy,R*.2,cx,cy,R*1.65);
        halo.addColorStop(0,'rgba(103,232,249,.13)');halo.addColorStop(.48,'rgba(168,85,247,.07)');halo.addColorStop(1,'rgba(5,0,8,0)');ctx.fillStyle=halo;ctx.fillRect(0,0,W,H);
        ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.clip();
        const disk=ctx.createRadialGradient(cx-R*.42,cy-R*.42,R*.08,cx,cy,R*1.04);
        disk.addColorStop(0,'#12213d');disk.addColorStop(.48,'#071126');disk.addColorStop(.82,'#040817');disk.addColorStop(1,'#01030a');ctx.fillStyle=disk;ctx.fillRect(cx-R,cy-R,R*2,R*2);
        const night=ctx.createLinearGradient(cx-R,cy,cx+R,cy);night.addColorStop(0,'rgba(5,0,8,.08)');night.addColorStop(.62,'rgba(5,0,8,.2)');night.addColorStop(1,'rgba(0,0,0,.82)');ctx.fillStyle=night;ctx.fillRect(cx-R,cy-R,R*2,R*2);
        ctx.strokeStyle='rgba(103,232,249,.14)';ctx.lineWidth=1;
        for(let lat=-60;lat<=60;lat+=20){const pts=[];for(let lo=-180;lo<=180;lo+=5)pts.push([lat,lo]);lineSphere(pts,rot)}
        for(let lo=-180;lo<180;lo+=30){const pts=[];for(let la=-90;la<=90;la+=5)pts.push([la,lo]);lineSphere(pts,rot)}
        pins.forEach((pin,index)=>{
          const p=project(pin.la,pin.lo,rot);if(p.z<.02)return;
          const isActive=index===active||index===0&&progress<.16;
          const pulse=reduce?1:1+Math.sin(elapsed*3.2+index)*.24;
          ctx.beginPath();ctx.arc(p.x,p.y,(isActive?5.5:3.2)*pulse,0,Math.PI*2);ctx.fillStyle=isActive?pin.color:'rgba(164,171,196,.62)';ctx.shadowBlur=isActive?18:7;ctx.shadowColor=isActive?pin.color:'#67e8f9';ctx.fill();ctx.shadowBlur=0;
          if(isActive){ctx.beginPath();ctx.arc(p.x,p.y,13*pulse,0,Math.PI*2);ctx.strokeStyle=pin.color+'66';ctx.lineWidth=1.4;ctx.stroke();ctx.font="700 15px 'Share Tech Mono',monospace";ctx.fillStyle='rgba(238,240,255,.86)';ctx.fillText(pin.label,p.x+17,p.y-12)}
        });
        ctx.restore();
        ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.strokeStyle='rgba(103,232,249,.29)';ctx.lineWidth=1.3;ctx.stroke();
        ctx.globalAlpha=satelliteAlpha;
        sats.forEach((sat,index)=>{
          const angle=sat.a+(reduce?0:elapsed*sat.s)+progress*(index%2?1.2:-1.1);
          ctx.beginPath();ctx.ellipse(cx,cy,sat.r,sat.r*.34,index===1?-.22:.12,0,Math.PI*2);ctx.strokeStyle=index===1?'rgba(103,232,249,.17)':'rgba(168,85,247,.2)';ctx.lineWidth=1;ctx.stroke();
          const x=cx+Math.cos(angle)*sat.r,y=cy+Math.sin(angle)*sat.r*.34;
          ctx.beginPath();ctx.arc(x,y,index===0?4.5:3.4,0,Math.PI*2);ctx.fillStyle=index===1?'#67e8f9':'#c084fc';ctx.shadowBlur=16;ctx.shadowColor=ctx.fillStyle;ctx.fill();ctx.shadowBlur=0;
          const tailX=x-Math.cos(angle)*24,tailY=y-Math.sin(angle)*8;const trail=ctx.createLinearGradient(tailX,tailY,x,y);trail.addColorStop(0,'rgba(103,232,249,0)');trail.addColorStop(1,index===1?'rgba(103,232,249,.65)':'rgba(192,132,252,.65)');ctx.beginPath();ctx.moveTo(tailX,tailY);ctx.lineTo(x,y);ctx.strokeStyle=trail;ctx.lineWidth=1.2;ctx.stroke();
        });
        ctx.globalAlpha=1;
        if(!reduce)raf=requestAnimationFrame(draw);
      }
      const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible&&!reduce&&!raf){last=0;raf=requestAnimationFrame(draw)}else if(!visible&&raf){cancelAnimationFrame(raf);raf=0}},{threshold:.02});
      observer.observe(hero);
      document.addEventListener('visibilitychange',()=>{if(!document.hidden&&visible&&!reduce&&!raf){last=0;raf=requestAnimationFrame(draw)}else if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0}});
      const clock=document.getElementById('otClock');
      function tickClock(){if(!clock)return;clock.textContent=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date())}
      tickClock();setInterval(tickClock,1000);
      draw(0);
    }
    orbitHeroCanvas();
'''

style_anchor = '  </style>'
if '/* ORBIT HERO V2' not in text:
    assert style_anchor in text, 'style closing anchor not found'
    text = text.replace(style_anchor, css + '\n' + style_anchor, 1)

hero_anchor = '        <div class="hero-sticky">\n          <div class="wrap hero-grid">'
if 'id="otGlobe"' not in text:
    assert hero_anchor in text, 'hero HTML anchor not found'
    text = text.replace(hero_anchor, '        <div class="hero-sticky">\n' + html + '          <div class="wrap hero-grid">', 1)

mobile_anchor = "        if(innerWidth<861){cards.forEach((c,i)=>c.classList.toggle('active',i===0));return}"
mobile_replacement = "        if(innerWidth<861){window.otOrbitProgress=0;cards.forEach((c,i)=>c.classList.toggle('active',i===0));return}"
if mobile_anchor in text:
    text = text.replace(mobile_anchor, mobile_replacement, 1)

progress_anchor = "        const r=hero.getBoundingClientRect(),max=Math.max(1,hero.offsetHeight-innerHeight),p=Math.max(0,Math.min(1,-r.top/max));"
progress_replacement = progress_anchor + "\n        window.otOrbitProgress=p;"
if 'window.otOrbitProgress=p;' not in text:
    assert progress_anchor in text, 'hero progress anchor not found'
    text = text.replace(progress_anchor, progress_replacement, 1)

js_anchor = '    heroScroll();\n\n    /* Glow cards */'
if 'function orbitHeroCanvas()' not in text:
    assert js_anchor in text, 'JS insertion anchor not found'
    text = text.replace(js_anchor, '    heroScroll();' + js + '\n\n    /* Glow cards */', 1)

path.write_text(text, encoding='utf-8')
print('Orbit hero patch applied successfully')
