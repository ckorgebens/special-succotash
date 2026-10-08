const positiveModulo=(value,length)=>((value%length)+length)%length;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export class AboutLoop {
  constructor(page){
    this.page=page;this.active=false;this.offset=0;this.target=0;this.last=0;
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.source=page.querySelector('.about-original');
    const s=q=>this.source.querySelector(q),split=el=>el.innerHTML.split(/<br\s*\/?>/i).map(part=>{const div=document.createElement('div');div.innerHTML=part;return div.textContent;});
    const copy=s('.about-copy').cloneNode(true);copy.querySelector('small')?.remove();
    this.content={
      eyebrow:s('.about-hero>.eyebrow').textContent,name:s('.about-hero h1').firstChild.textContent,chinese:s('.about-name').textContent,
      tagline:split(s('.about-hero h1 em')),city:s('.about-education>span').textContent,education:split(s('.about-education p')),
      storyLabel:s('.about-story>.eyebrow').textContent,story:split(s('.about-story>p')),copy:copy.textContent,
      principles:[...this.source.querySelectorAll('.principles article')].map(el=>({number:el.querySelector('span').textContent,title:el.querySelector('h2').textContent,text:el.querySelector('p').textContent})),
      contactLabel:s('.contact-footer>.eyebrow').textContent,contactTitle:split(s('.contact-footer h2')),contactField:s('.contact-row>div>span').textContent,contactValues:split(s('.contact-row p')),contactAction:s('#contact-button').textContent,contactHref:s('#contact-button').getAttribute('href'),
      meta:[...this.source.querySelectorAll('.footer-meta>*')].map(el=>el.textContent),
    };
    s('#contact-button').id='contact-source';s('#back-to-top').id='top-source';s('#about-title').id='about-title-source';
    this.stage=document.createElement('div');this.stage.className='about-stage';this.stage.setAttribute('aria-label','关于设计师，无限循环滚动');this.stage.tabIndex=0;
    this.stage.innerHTML='<div class="about-loop-track"></div><div class="about-obstacle" aria-hidden="true"><img class="about-model-fallback" src="./assets/glass-study.png" alt=""></div>';
    page.append(this.stage);this.track=this.stage.querySelector('.about-loop-track');this.obstacle=this.stage.querySelector('.about-obstacle');
    this.measureCanvas=document.createElement('canvas');this.measureContext=this.measureCanvas.getContext('2d');
    this.blocks=[];this.lines=[];this.layout();
    document.fonts.ready.then(()=>this.layout());
    window.addEventListener('resize',()=>this.layout());
    this.stage.addEventListener('wheel',e=>{if(!this.active)return;e.preventDefault();const factor=e.deltaMode===1?16:e.deltaMode===2?this.height:1;this.target+=e.deltaY*factor;},{passive:false});
    let touchY=0,touchTime=0,velocity=0;
    this.stage.addEventListener('touchstart',e=>{touchY=e.touches[0].clientY;touchTime=performance.now();velocity=0;},{passive:true});
    this.stage.addEventListener('touchmove',e=>{if(!this.active)return;e.preventDefault();const y=e.touches[0].clientY,now=performance.now(),dy=touchY-y;velocity=dy/Math.max(now-touchTime,1);this.target+=dy;touchY=y;touchTime=now;},{passive:false});
    this.stage.addEventListener('touchend',()=>{if(!this.reduced)this.target+=Math.max(-360,Math.min(360,velocity*130));},{passive:true});
    window.addEventListener('keydown',e=>{
      if(!this.active||e.ctrlKey||e.metaKey||e.altKey||e.target.matches('input,textarea,select'))return;
      const amount={ArrowDown:65,ArrowUp:-65,PageDown:this.height*.8,PageUp:-this.height*.8,' ':e.shiftKey?-this.height*.8:this.height*.8}[e.key];
      if(amount!==undefined&&!e.target.closest('button,a')){e.preventDefault();this.target+=amount;}
      if(e.key==='Home'){e.preventDefault();this.goToStart();}
      if(e.key==='End'){e.preventDefault();this.target+=this.footerTop-positiveModulo(this.target,this.cycleLength);}
    });
    document.addEventListener('visibilitychange',()=>this.last=0);
    this.frame=this.frame.bind(this);requestAnimationFrame(this.frame);
  }
  makeBlock(className,top){const block=document.createElement('section');block.className=`about-loop-block ${className}`;block.style.top='0px';this.track.append(block);const entry={element:block,top,height:0,lines:[]};this.blocks.push(entry);return entry;}
  font(size=16,weight=400,family='Teodor'){return `${weight} ${size}px ${family}, "Microsoft YaHei", sans-serif`;}
  wrap(text,width,font){
    const ctx=this.measureContext;ctx.font=font;const result=[];let line='';
    // This runs only on resize/font load. Scrolling never recalculates line breaks.
    const tokens=text.match(/[A-Za-z0-9]+(?:[’'-][A-Za-z0-9]+)*[.,!?;:]?|[\s\S]/gu)||[];
    for(const token of tokens){
      const units=ctx.measureText(token).width>width?[...token]:[token];
      for(const char of units){const next=line+char;const closing=/^[，。！？、；：）》」』】….,!?;:]$/.test(char);if(line&&ctx.measureText(next).width>width&&!closing){result.push(line);line=char;}else line=next;}
    }
    if(line)result.push(line);return result;
  }
  addLine(block,text,side,y,{size=this.textSize,weight=400,family='Teodor',className='',tag='span',action,href}={}){
    const el=document.createElement(tag);el.className=`about-loop-line ${className}`;el.textContent=text;el.style.font=this.font(size,weight,family);el.style.top=y+'px';el.dataset.side=side;
    if(action)el.dataset.aboutAction=action;
    if(href)el.setAttribute('href',href);
    this.measureContext.font=this.font(size,weight,family);const width=this.measureContext.measureText(text).width;
    const line={element:el,text,width,y,side,x:0,initialized:false,size};block.element.append(el);block.lines.push(line);this.lines.push(line);return line;
  }
  addParagraph(block,text,side,start,{className='',size=this.textSize}={}){
    const rows=this.wrap(text,this.columnWidth,this.font(size));
    for(const [i,row] of rows.entries())this.addLine(block,row,side,start+i*this.lineHeight,{size,className});
    return start+rows.length*this.lineHeight;
  }
  heading(block,label,roman,title){
    this.addLine(block,label,'header-left',38,{size:this.mobile?11:14,weight:500,family:'Lay',className:'about-block-label'});
    this.addLine(block,roman,'center',14,{size:this.mobile?50:64,className:'about-roman'});
    if(title)this.addLine(block,title,'header-right',38,{size:this.mobile?11:14,weight:500,family:'Lay',className:'about-block-label',tag:'h2'});
  }
  pairedText(block,left,right,start=147){
    let leftEnd=start;
    for(const text of left)leftEnd=this.addParagraph(block,text,'left',leftEnd);
    let rightEnd=this.mobile?leftEnd+this.lineHeight:leftEnd-this.lineHeight;
    for(const text of right)rightEnd=this.addParagraph(block,text,'right',rightEnd);
    return Math.max(leftEnd,rightEnd);
  }
  layout(){
    const oldLength=this.cycleLength||1,phase=positiveModulo(this.offset,oldLength)/oldLength;
    this.width=innerWidth;this.height=innerHeight;this.mobile=this.width<=640;
    this.modelSize=this.mobile?Math.min(130,this.width*.30):200;
    this.radiusX=this.modelSize*.66;this.radiusY=this.modelSize*.88;
    this.textSize=this.mobile?14:16;this.lineHeight=this.mobile?23:25.6;
    this.columnWidth=Math.min(250,this.width/2-this.radiusX-20-this.textSize);
    this.track.replaceChildren();this.blocks=[];this.lines=[];
    const d=this.content,hero=this.makeBlock('about-loop-hero',0);
    const heroTitle=document.createElement('h1');heroTitle.id='about-title';heroTitle.className='about-loop-title';heroTitle.innerHTML=`${escape(d.name)} <span>${escape(d.chinese)}</span>`;heroTitle.style.top=(this.height*.21)+'px';hero.element.append(heroTitle);
    this.addLine(hero,d.eyebrow,'center',this.height*.15,{size:10,weight:500,family:'Lay',className:'about-hero-eyebrow'});
    // Keep hero lines clear of the fixed model; body rows use the same obstacle solver.
    const below=this.height*.5+this.modelSize*.6+24;
    d.tagline.forEach((text,i)=>this.addLine(hero,text,'center',below+i*(this.mobile?35:64),{size:this.mobile?28:Math.min(64,this.width*.05),className:'about-hero-statement'}));
    let educationY=below+d.tagline.length*(this.mobile?35:64)+48;
    this.addLine(hero,d.city,'center',educationY,{size:this.mobile?10:13,weight:500,family:'Lay'});
    for(const [i,text] of d.education.entries())this.addLine(hero,text,'center',educationY+30+i*23,{size:this.mobile?11:13,weight:500,family:'Lay'});
    hero.height=Math.max(this.height*1.2,educationY+130);
    let top=hero.height+110;
    const story=this.makeBlock('about-loop-story',top);this.heading(story,d.storyLabel,'I','');
    const end=this.pairedText(story,d.story,[d.copy]);
    story.height=end+170;top+=story.height;
    for(const [i,p]of d.principles.entries()){
      const block=this.makeBlock('about-loop-principle',top);this.heading(block,p.number,['II','III','IV'][i],p.title);
      const allRows=this.wrap(p.text,this.columnWidth,this.font(this.textSize));const half=Math.ceil(allRows.length/2);
      const leftRows=allRows.slice(0,half),rightRows=allRows.slice(half);
      let y=147;for(const row of leftRows){this.addLine(block,row,'left',y);y+=this.lineHeight;}
      y+=this.mobile?this.lineHeight:-this.lineHeight;
      for(const row of rightRows){this.addLine(block,row,'right',y);y+=this.lineHeight;}
      block.height=y+170;top+=block.height;
    }
    const footer=this.makeBlock('about-loop-contact',top);this.footerTop=top;
    this.heading(footer,d.contactLabel,'V','');
    let y=147;for(const text of d.contactTitle){y=this.addParagraph(footer,text,'left',y);}
    y+=this.lineHeight;
    y=this.addParagraph(footer,d.contactField,'right',y);
    for(const value of d.contactValues)y=this.addParagraph(footer,value,'right',y);
    const contact=this.addLine(footer,d.contactAction,'right',y+20,{tag:'a',action:'contact',href:d.contactHref,size:this.mobile?16:20});contact.element.id='contact-button';
    y+=this.lineHeight+85;
    this.addLine(footer,d.meta[0],'left',y,{size:this.mobile?9:11,weight:500,family:'Lay'});
    this.addLine(footer,d.meta[1],'right',y+this.lineHeight,{size:this.mobile?9:11,weight:500,family:'Lay'});
    const back=this.addLine(footer,d.meta[2],'right',y+this.lineHeight*2+16,{tag:'button',action:'top',size:this.mobile?10:12,weight:500,family:'Lay'});back.element.id='back-to-top';
    footer.height=y+190;top+=footer.height;
    this.cycleLength=top+this.height*.3;
    for(const block of this.blocks)block.element.style.height=block.height+'px';
    this.offset=this.target=phase*this.cycleLength;
    this.stage.dataset.cycleLength=this.cycleLength.toFixed(3);this.stage.dataset.radiusX=this.radiusX.toFixed(3);this.stage.dataset.radiusY=this.radiusY.toFixed(3);
    this.obstacle.style.width=this.modelSize+'px';this.obstacle.style.height=this.modelSize+'px';this.stage.classList.add('ready');this.resizeModel?.();this.position(1,true);
    this.track.onclick=e=>{const action=e.target.closest('[data-about-action]')?.dataset.aboutAction;if(action==='top')this.goToStart();};
  }
  displacement(line,centerY){
    if(!['left','right'].includes(line.side))return 0;
    const upper=centerY-line.size*.7,lower=centerY+line.size*.7;
    const nearest=upper>this.height/2?upper:lower<this.height/2?lower:this.height/2;
    const distance=Math.abs(nearest-this.height/2),normalized=distance/this.radiusY;
    return normalized<1?this.radiusX*Math.sqrt(Math.max(0,1-normalized*normalized))+10:0;
  }
  position(dt,immediate=false){
    const h=this.height,L=this.cycleLength;
    for(const block of this.blocks){
      const base=block.top-this.offset;
      // Recycle a whole block only while it is completely outside the viewport.
      const y=base+Math.round((h/2-base-block.height/2)/L)*L;
      block.element.style.transform=`translate3d(0,${y}px,0)`;block.element.dataset.displayY=y.toFixed(3);
      for(const line of block.lines){
        const centerY=y+line.y+line.size*.5;
        const predictedY=centerY-(this.velocity||0)*6;
        const crossesCenter=(centerY-h/2)*(predictedY-h/2)<0;
        const corridorClearance=crossesCenter&&['left','right'].includes(line.side)?this.radiusX+10:0;
        const shift=Math.max(this.displacement(line,centerY),this.displacement(line,predictedY),corridorClearance);
        const headerGap=this.mobile?Math.min(90,this.width/2-line.width-12):90;
        const anchor={'left':-6-line.width-shift,'right':6+shift,'center':-line.width/2,'header-left':-headerGap-line.width,'header-right':headerGap}[line.side];
        const smoothing=1-Math.pow(1-.138,dt);
        line.x=immediate||!line.initialized?anchor:line.x+(anchor-line.x)*smoothing;line.initialized=true;
        line.element.style.transform=`translate3d(${line.x}px,0,0)`;
      }
    }
    this.stage.dataset.phase=positiveModulo(this.offset,L).toFixed(3);this.stage.dataset.offset=this.offset.toFixed(3);
  }
  frame(now){
    requestAnimationFrame(this.frame);if(!this.active||document.hidden){this.last=0;return;}
    const dt=this.last?Math.min((now-this.last)/16.667,3):1;this.last=now;
    const difference=this.target-this.offset;
    const movement=difference*(this.reduced?1:1-Math.pow(.88,dt));
    const step=this.reduced?movement:Math.max(-18*dt,Math.min(18*dt,movement));
    this.offset+=step;this.velocity=step/dt;
    if(Math.abs(this.target-this.offset)<.001)this.offset=this.target;
    // Rebase both values together, preserving their exact difference and loop phase.
    if(Math.abs(this.offset)>this.cycleLength*1000){const cycles=Math.trunc(this.offset/this.cycleLength)*this.cycleLength;this.offset-=cycles;this.target-=cycles;}
    this.position(dt,this.reduced);
    this.renderModel?.(dt,now);
  }
  goToStart(){this.target-=positiveModulo(this.target,this.cycleLength);}
  setActive(active){this.active=active;this.last=0;if(active){this.layout();if(!this.modelStarted){this.modelStarted=true;this.initModel();}}}
  async initModel(){
    try{
      const THREE=await import('./vendor/three/three.module.js'),{GLTFLoader}=await import('./vendor/three/GLTFLoader.js');
      const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0xffffff,0);
      const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,.1,100);camera.position.z=13;
      const group=new THREE.Group();scene.add(group);this.obstacle.append(renderer.domElement);
      const [gltf,matcap]=await Promise.all([new GLTFLoader().loadAsync('./assets/about/model.glb'),new THREE.TextureLoader().loadAsync('./assets/about/matcap.jpg')]);matcap.colorSpace=THREE.NoColorSpace;
      const chrome=new THREE.ShaderMaterial({uniforms:{u_matcap:{value:matcap}},transparent:true,
        vertexShader:'varying vec2 v_reflection;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vec3 reflected=reflect(normalize(mv.xyz),normalize(normalMatrix*normal));float denominator=2.*sqrt(dot(reflected.xy,reflected.xy)+pow(reflected.z+1.,2.));v_reflection=reflected.xy/max(denominator,.0001)+.5;gl_Position=projectionMatrix*mv;}',
        fragmentShader:'uniform sampler2D u_matcap;varying vec2 v_reflection;void main(){vec4 material=texture2D(u_matcap,v_reflection);vec3 color=pow(max(material.rgb,vec3(0.)),vec3(1./1.465));color=(color*.984-.0459-.5)*1.353+.5;gl_FragColor=vec4(max(color,vec3(0.)),material.a);}'
      });
      const model=gltf.scene,box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());model.position.sub(center);model.traverse(mesh=>{if(mesh.isMesh)mesh.material=chrome;});group.add(model);
      const mixer=new THREE.AnimationMixer(model);const idle=gltf.animations.find(clip=>clip.name==='eyes-idle'),idleAction=idle?mixer.clipAction(idle):null;idleAction?.play();
      const eyes=model.getObjectByName('gio-eyes-idle'),eyesBaseY=eyes?.scale.y||1;
      let px=.59,py=-.62,rx=-.62,ry=.59,roll=.2,lastActivity=performance.now(),sleeping=false;
      window.addEventListener('pointermove',e=>{if(!this.active)return;lastActivity=performance.now();px=Math.max(-.59,Math.min(.59,(e.clientX-this.width/2)/(this.width/2)));py=Math.max(-.62,Math.min(.62,(e.clientY-this.height/2)/(this.height/2)));roll=.2*(e.clientX-this.width/2)/(this.width/2);});
      for(const event of ['wheel','pointerdown','touchstart','keydown'])window.addEventListener(event,()=>{if(this.active)lastActivity=performance.now();},{passive:true});
      this.resizeModel=()=>{const canvasSize=this.modelSize*1.4;renderer.setSize(canvasSize,canvasSize);renderer.domElement.style.width=canvasSize+'px';renderer.domElement.style.height=canvasSize+'px';const visibleWorld=2*Math.tan(THREE.MathUtils.degToRad(45/2))*13;const scale=(this.modelSize/canvasSize)*visibleWorld/size.y*.9;group.scale.setScalar(scale);};
      this.resizeModel();this.obstacle.classList.add('model-ready');
      this.renderModel=(dt,now)=>{const t=now*.001,shouldSleep=!this.reduced&&now-lastActivity>30000;if(shouldSleep!==sleeping){sleeping=shouldSleep;if(sleeping)idleAction?.stop();else{if(eyes)eyes.scale.y=eyesBaseY;idleAction?.reset().play();}}rx+=((sleeping?.42:py)-rx)*.08;ry+=((sleeping?0:px)-ry)*.08;group.rotation.set(rx,ry,(sleeping?.12:roll)+(!this.reduced?Math.sin(t*.35)*.015:0));if(!this.reduced)mixer.update(dt/60);if(sleeping&&eyes)eyes.scale.y+=(eyesBaseY*.2-eyes.scale.y)*.065;renderer.render(scene,camera);};
      this.stage.dataset.modelReady='true';
    }catch(error){console.warn('About model fallback',error);this.stage.dataset.modelReady='fallback';}
  }
}
