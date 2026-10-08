// A Fibonacci distribution on a sphere, rotated in 3D and rendered with WebGL.
// Every card has a real XYZ coordinate. Perspective is camera / (camera - z).
export class SphereGallery {
  constructor(canvas,items,{onHover,onSelect,onReady}={}) {
    this.canvas=canvas;this.items=items;this.onHover=onHover;this.onSelect=onSelect;
    this.stage=canvas.parentElement;this.gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.paused=this.reduced;this.active=true;this.dragging=false;this.hover=-1;
    this.rx=-.13;this.ry=.4;this.vx=0;this.vy=0;this.pointer={x:-10000,y:-10000};
    this.geometry=items.map((item,i)=>{
      const y=1-2*(i+.5)/items.length;
      const theta=i*Math.PI*(3-Math.sqrt(5));
      const radial=Math.sqrt(1-y*y);
      return{x:Math.cos(theta)*radial,y,z:Math.sin(theta)*radial,item,index:i,texture:null,image:null,ar:.75,hoverScale:1};
    });
    this.resize=()=>{const r=this.stage.getBoundingClientRect();this.width=r.width;this.height=r.height;this.dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*this.dpr);canvas.height=Math.round(r.height*this.dpr);this.mobile=r.width<701;this.radius=this.mobile?Math.min(r.width*.34,r.height*.24):Math.min(r.width*.215,r.height*.33,340);this.camera=this.radius*4.8;this.center={x:r.width/2,y:r.height*(this.mobile?.39:.49)};if(this.gl)this.gl.viewport(0,0,canvas.width,canvas.height);};
    this.resize();new ResizeObserver(this.resize).observe(this.stage);
    if(this.gl){this.setupGL();}else{this.setupFallback();}
    this.bindEvents();
    Promise.allSettled(this.geometry.map(g=>this.load(g))).then(()=>{this.stage.classList.add('ready');onReady?.();});
    this.last=0;this.frame=this.frame.bind(this);requestAnimationFrame(this.frame);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.gl=null;this.setupFallback();});
  }
  setupGL(){
    const gl=this.gl;
    const vertex=`attribute vec3 a_position;attribute vec2 a_uv;uniform vec2 u_resolution;uniform vec2 u_center;uniform float u_camera;varying vec2 v_uv;void main(){float w=u_camera-a_position.z;vec2 screen=u_center+vec2(a_position.x,-a_position.y)*u_camera/w;vec2 clip=screen/u_resolution*2.0-1.0;gl_Position=vec4(clip.x*w,-clip.y*w,0.0,w);v_uv=a_uv;}`;
    const fragment=`precision mediump float;uniform sampler2D u_image;uniform float u_opacity;uniform float u_highlight;varying vec2 v_uv;void main(){vec4 c=texture2D(u_image,v_uv);c.rgb=mix(c.rgb,vec3(1.0),u_highlight*0.035);gl_FragColor=vec4(c.rgb,c.a*u_opacity);}`;
    const compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
    const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));gl.useProgram(p);this.program=p;
    this.uniform={};for(const name of ['u_resolution','u_center','u_camera','u_image','u_opacity','u_highlight'])this.uniform[name]=gl.getUniformLocation(p,name);
    this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
    for(const [name,size,offset]of [['a_position',3,0],['a_uv',2,12]]){const loc=gl.getAttribLocation(p,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,20,offset);}
    gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);gl.clearColor(1,1,1,1);gl.uniform1i(this.uniform.u_image,0);
  }
  async load(g){
    const img=new Image();g.image=img;
    await new Promise((resolve)=>{img.onload=()=>resolve(true);img.onerror=()=>resolve(false);img.src=g.item.cover;});
    if(!img.naturalWidth)return;
    // Keep a common portrait format; crop wider photography with texture UVs.
    g.ar=.75;g.sourceAr=img.naturalWidth/img.naturalHeight;
    if(!this.gl)return;
    const gl=this.gl;g.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,g.texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    if(g.item.video){const video=document.createElement('video');video.muted=true;video.loop=true;video.playsInline=true;video.preload='auto';video.src=g.item.video;g.video=video;video.addEventListener('loadeddata',()=>{g.sourceAr=video.videoWidth/video.videoHeight;if(this.active&&!this.paused)video.play().catch(()=>{});});video.load();}
  }
  setupFallback(){
    const el=document.querySelector('#sphere-fallback');el.hidden=false;this.canvas.hidden=true;
    el.replaceChildren(...this.items.map(item=>{const b=document.createElement('button');b.setAttribute('aria-label',item.title);const im=new Image();im.src=item.cover;im.alt=item.title;b.append(im);b.onclick=()=>this.onSelect?.(item);return b;}));
  }
  bindEvents(){
    const canvas=this.canvas;
    const point=e=>{const rect=canvas.getBoundingClientRect();return{x:e.clientX-rect.left,y:e.clientY-rect.top};};
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;this.dragging=true;this.start=point(e);this.previous=this.start;this.travel=0;this.vx=this.vy=0;this.hover=-1;this.onHover?.(null);this.stage.classList.add('dragging');canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{const p=point(e);this.pointer=p;if(!this.dragging)return;const dx=p.x-this.previous.x,dy=p.y-this.previous.y;this.travel+=Math.hypot(dx,dy);this.vy=dx*.004;this.vx=dy*.004;this.ry+=this.vy;this.rx+=this.vx;this.previous=p;});
    const release=e=>{if(!this.dragging)return;this.dragging=false;this.stage.classList.remove('dragging');if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(this.travel<7){const hit=this.hit(point(e));if(hit)this.onSelect?.(hit.item);}};
    canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',()=>{this.dragging=false;this.stage.classList.remove('dragging');});
    canvas.addEventListener('pointerleave',()=>{if(!this.dragging){this.pointer={x:-10000,y:-10000};this.hover=-1;this.onHover?.(null);}});
    this.stage.addEventListener('wheel',e=>{e.preventDefault();if(!this.active)return;this.vy+=Math.max(-150,Math.min(150,e.deltaY+e.deltaX))*.00009;},{passive:false});
    document.addEventListener('visibilitychange',()=>{this.last=0;});
  }
  transform(g){
    const r=this.radius,cx=Math.cos(this.rx),sx=Math.sin(this.rx),cy=Math.cos(this.ry),sy=Math.sin(this.ry);
    const x=g.x*cy+g.z*sy,z=-g.x*sy+g.z*cy;
    const y=g.y*cx-z*sx,z2=g.y*sx+z*cx;
    g.world={x:x*r,y:y*r,z:z2*r};
    const scale=this.camera/(this.camera-g.world.z),w=this.radius*(this.mobile?.28:.245)*g.hoverScale,h=w/g.ar;
    g.dim={w,h};g.screen={x:this.center.x+g.world.x*scale,y:this.center.y-g.world.y*scale,w:w*scale,h:h*scale};
    g.depth=(z2+1)/2;return g;
  }
  hit(p){
    return [...(this.sorted||[])].reverse().find(g=>g.texture&&g.depth>.27&&Math.abs(p.x-g.screen.x)<g.screen.w*.5&&Math.abs(p.y-g.screen.y)<g.screen.h*.5);
  }
  frame(now){
    requestAnimationFrame(this.frame);
    if(!this.active||document.hidden){this.last=now;return;}
    const dt=this.last?Math.min((now-this.last)/16.667,2.5):1;this.last=now;
    if(!this.dragging){
      this.vx*=Math.pow(.947,dt);this.vy*=Math.pow(.947,dt);
      this.rx+=this.vx*dt;this.ry+=this.vy*dt;
      if(!this.paused){this.ry+=.00115*dt*(this.hover>=0?.18:1);}
    }
    this.sorted=this.geometry.map(g=>this.transform(g)).sort((a,b)=>a.world.z-b.world.z);
    if(!this.dragging){const hit=this.hit(this.pointer),next=hit?.index??-1;if(next!==this.hover){this.hover=next;this.onHover?.(hit?.item||null);}}
    for(const g of this.geometry)g.hoverScale+=(g.index===this.hover?1.085-g.hoverScale:1-g.hoverScale)*.13*dt;
    if(!this.gl)return;
    const gl=this.gl;gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.program);gl.uniform2f(this.uniform.u_resolution,this.width,this.height);gl.uniform2f(this.uniform.u_center,this.center.x,this.center.y);gl.uniform1f(this.uniform.u_camera,this.camera);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
    for(const g of this.sorted){if(!g.texture)continue;const {x,y,z}=g.world,hw=g.dim.w/2,hh=g.dim.h/2;
      const ar=g.sourceAr||.75;let u0=0,u1=1,v0=0,v1=1;if(ar>g.ar){const span=g.ar/ar;u0=(1-span)/2;u1=1-u0;}else{const span=ar/g.ar;v0=(1-span)/2;v1=1-v0;}
      const vertices=new Float32Array([x-hw,y-hh,z,u0,v0,x+hw,y-hh,z,u1,v0,x-hw,y+hh,z,u0,v1,x-hw,y+hh,z,u0,v1,x+hw,y-hh,z,u1,v0,x+hw,y+hh,z,u1,v1]);
      gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.DYNAMIC_DRAW);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,g.texture);if(g.video?.readyState>=2)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,g.video);gl.uniform1f(this.uniform.u_opacity,.34+.66*Math.pow(g.depth,.65));gl.uniform1f(this.uniform.u_highlight,g.index===this.hover?1:0);gl.drawArrays(gl.TRIANGLES,0,6);
    }
  }
  syncVideos(){for(const g of this.geometry){if(!g.video)continue;if(this.active&&!this.paused)g.video.play().catch(()=>{});else g.video.pause();}}
  setActive(active){this.active=active;this.last=0;if(!active){this.hover=-1;this.onHover?.(null);}this.syncVideos();}
  setPaused(paused){this.paused=paused;this.syncVideos();}
}
