// Only the top/bottom strips are drawn. Project DOM, sizing and scrolling stay intact.
// A deterministic cylindrical lens bends source pixels; no turbulence or animated noise.
export class EdgeGlass {
  constructor(page){
    this.page=page;this.active=false;this.cache=[];this.images=[];
    this.canvas=document.createElement('canvas');this.canvas.className='project-glass-canvas';this.canvas.setAttribute('aria-hidden','true');document.body.append(this.canvas);
    this.source=document.createElement('canvas');this.ctx=this.source.getContext('2d',{alpha:false});
    this.gl=this.canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false});
    if(!this.gl){this.canvas.remove();return;}
    this.setup();this.resize();this.frame=this.frame.bind(this);requestAnimationFrame(this.frame);
    window.addEventListener('resize',()=>{this.resize();if(this.active)this.measure();});
    document.fonts.ready.then(()=>{if(this.active)this.measure();});
    page.addEventListener('load',()=>{if(this.active)this.measure();},true);
  }
  setup(){
    const gl=this.gl;
    const vs='attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}';
    const fs=`precision highp float;
      uniform sampler2D u_source;uniform float u_band;varying vec2 v_uv;
      float lens(float t){t=clamp(t,0.,1.);return 1.-sqrt(max(0.,1.-t*t));}
      void main(){
        vec2 uv=v_uv;float distance=0.;
        if(uv.y>1.-u_band){distance=lens((uv.y-1.+u_band)/u_band)*u_band;uv.y-=distance;}
        else if(uv.y<u_band){distance=lens((u_band-uv.y)/u_band)*u_band;uv.y+=distance;}
        else discard;
        vec3 color=vec3(0.);vec3 weights=vec3(0.);
        for(int i=0;i<16;i++){
          float t=float(i)/15.;
          vec3 spectrum=vec3(1.-smoothstep(.2,.8,t),smoothstep(0.,.5,t)*(1.-smoothstep(.5,1.,t)),smoothstep(.2,.8,t));
          vec2 sampleUv=clamp(uv+vec2(0.,(t-.5)*distance*.30),vec2(0.),vec2(1.));
          color+=texture2D(u_source,sampleUv).rgb*spectrum;weights+=spectrum;
        }
        gl_FragColor=vec4(color/max(weights,vec3(.0001)),1.);
      }`;
    const shader=(type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
    const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));gl.useProgram(p);this.program=p;
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(p,'a_position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    this.bandUniform=gl.getUniformLocation(p,'u_band');gl.uniform1i(gl.getUniformLocation(p,'u_source'),0);
    this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.clearColor(0,0,0,0);
  }
  resize(){
    this.width=innerWidth;this.height=innerHeight;this.dpr=Math.min(devicePixelRatio||1,1.5);
    this.band=Math.min(this.height*.08,90);this.sampleBand=this.band*1.65;
    this.canvas.width=this.source.width=Math.round(this.width*this.dpr);this.canvas.height=this.source.height=Math.round(this.height*this.dpr);
    this.gl?.viewport(0,0,this.canvas.width,this.canvas.height);
  }
  measure(){
    if(this.page.hidden)return;
    this.images=[...this.page.querySelectorAll('img,video')];this.cache=[];
    const scroll=this.page.scrollTop,walker=document.createTreeWalker(this.page,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(!node.textContent.trim())continue;
      const parent=node.parentElement,style=getComputedStyle(parent);
      if(style.display==='none'||style.visibility==='hidden')continue;
      const font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const range=document.createRange();let line=null;
      for(let index=0;index<node.length;){
        const code=node.textContent.codePointAt(index),count=code>65535?2:1;
        range.setStart(node,index);range.setEnd(node,index+count);index+=count;
        const rect=range.getBoundingClientRect();if(!rect.width||!rect.height)continue;
        let char=String.fromCodePoint(code);if(/\s/.test(char))char=' ';
        if(style.textTransform==='uppercase')char=char.toUpperCase();
        if(!line||Math.abs(line.y-(rect.top+scroll))>2){
          line={x:rect.left,y:rect.top+scroll,height:rect.height,text:'',font,color:style.color,spacing:style.letterSpacing,parent};this.cache.push(line);
        }
        line.text+=char;
      }
      range.detach();
    }
  }
  opacity(element){let opacity=1;for(let el=element;el&&el!==this.page;el=el.parentElement){const value=Number(getComputedStyle(el).opacity);opacity*=value;if(opacity<.001)break;}return opacity;}
  inBand(y,h){return y+h>=0&&y<=this.sampleBand||y+h>=this.height-this.sampleBand&&y<=this.height;}
  drawSource(){
    const ctx=this.ctx,dpr=this.dpr,w=this.width,h=this.height;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;ctx.filter='none';ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
    ctx.save();ctx.beginPath();ctx.rect(0,0,w,this.sampleBand);ctx.rect(0,h-this.sampleBand,w,this.sampleBand);ctx.clip();
    for(const image of this.images){
      const rect=image.getBoundingClientRect();if(!this.inBand(rect.top,rect.height))continue;
      const iw=image.videoWidth||image.naturalWidth,ih=image.videoHeight||image.naturalHeight;
      if(!iw||!ih||image.tagName==='VIDEO'&&image.readyState<2)continue;
      const opacity=this.opacity(image);if(opacity<.001)continue;
      const style=getComputedStyle(image),fit=style.objectFit;
      const scale=fit==='contain'?Math.min(rect.width/iw,rect.height/ih):Math.max(rect.width/iw,rect.height/ih);
      const dw=iw*scale,dh=ih*scale;
      ctx.save();ctx.beginPath();ctx.rect(rect.left,rect.top,rect.width,rect.height);ctx.clip();
      const clipParent=image.closest('.project-media,.exploration-image');if(clipParent){const c=clipParent.getBoundingClientRect();ctx.beginPath();ctx.rect(c.left,c.top,c.width,c.height);ctx.clip();}
      ctx.globalAlpha=opacity;ctx.filter=style.filter;ctx.drawImage(image,rect.left+(rect.width-dw)/2,rect.top+(rect.height-dh)/2,dw,dh);ctx.restore();
    }
    ctx.filter='none';ctx.textAlign='left';ctx.textBaseline='alphabetic';
    const scroll=this.page.scrollTop;
    for(const line of this.cache){
      const y=line.y-scroll;if(!this.inBand(y,line.height))continue;
      const opacity=this.opacity(line.parent);if(opacity<.001)continue;
      ctx.globalAlpha=opacity;ctx.font=line.font;ctx.fillStyle=line.color;
      if('letterSpacing' in ctx)ctx.letterSpacing=line.spacing==='normal'?'0px':line.spacing;
      const ascent=ctx.measureText(line.text).fontBoundingBoxAscent||line.height*.8;
      ctx.fillText(line.text,line.x,y+ascent);
    }
    ctx.restore();
  }
  frame(){
    requestAnimationFrame(this.frame);
    if(!this.active||!this.gl||document.hidden)return;
    this.drawSource();const gl=this.gl;gl.useProgram(this.program);gl.clear(gl.COLOR_BUFFER_BIT);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.source);gl.uniform1f(this.bandUniform,this.band/this.height);gl.drawArrays(gl.TRIANGLES,0,6);
  }
  setActive(active){this.active=active;this.canvas.hidden=!active;if(active){this.resize();this.measure();requestAnimationFrame(()=>this.measure());}}
}
