import {projects,explorations,gallery} from './data.js';
import {SphereGallery} from './sphere.js';
import {EdgeGlass} from './edge-glass.js';
import {AboutLoop} from './about-loop.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mediaMarkup(item,{detail=false}={}){
  const src=typeof item==='string'?item:item.src;
  const video=typeof item==='object'&&item.kind==='video';
  const fit=typeof item==='object'&&item.fit==='contain'?' media-contain':'';
  const alt=typeof item==='object'?item.alt||'':item;
  if(video)return `<video class="${detail?'case-asset ':''}content-video${fit}" src="${escape(src)}" ${item.poster?`poster="${escape(item.poster)}"`:''} ${detail?'controls':''} muted loop playsinline preload="metadata" aria-label="${escape(alt)}"></video>`;
  return `<img class="${detail?'case-asset ':''}${fit}" src="${escape(src)}" alt="${escape(alt)}" ${detail?'loading="lazy"':''}>`;
}
const videoObserver=new IntersectionObserver(entries=>{for(const entry of entries){const video=entry.target;if(entry.isIntersecting&&!reduced&&!video.closest('[hidden]'))video.play().catch(()=>{});else video.pause();}},{threshold:.12});
function observeVideos(root){for(const video of root.querySelectorAll('.content-video')){videoObserver.unobserve(video);videoObserver.observe(video);}}
function removeCaseMedia(){for(const video of $('#case-content').querySelectorAll('video')){video.pause();videoObserver.unobserve(video);}}
let current='creative',sphere,activeItem,lastFocus,caseReturnFocus,edgeGlass,aboutLoop;
let returnTo='projects',previousHash='#projects';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
$('#project-list').innerHTML=projects.map((p,i)=>`<article class="project-card reveal"><button class="project-media" data-case="${p.id}" aria-label="查看项目 ${escape(p.title)}">${p.video?mediaMarkup({src:p.video,kind:'video',poster:p.cover,alt:p.title+' 项目封面',fit:p.coverFit}):`<img class="${p.coverFit==='contain'?'media-contain':''}" src="${p.cover}" alt="${escape(p.title)} 项目封面" loading="lazy">`}<span class="view-project">View Case ↗</span></button><div class="project-meta"><span class="number">0${i+1}</span><div><button data-case="${p.id}"><h2>${escape(p.title)}</h2></button><p class="tags">${escape(p.type)}</p></div><p class="project-description">${escape(p.description)}</p></div></article>`).join('');
$('#exploration-grid').innerHTML=explorations.map(p=>`<button class="exploration-card reveal ${!p.reference?'local':''}" data-explore="${p.id}" aria-label="查看 ${escape(p.title)}"><div class="exploration-image">${p.video?`<video class="content-video" src="${p.video}" muted loop playsinline preload="metadata" poster="${p.cover}" aria-label="${escape(p.title)}"></video>`:`<img src="${p.cover}" alt="${escape(p.title)}" loading="lazy">`}</div><h3>${escape(p.title)}</h3><p>${escape(p.type)}</p></button>`).join('');
observeVideos($('#projects'));
$('#index-items').innerHTML=gallery.filter((p,i,arr)=>arr.findIndex(v=>v.id===p.id)===i).map(p=>`<button data-gallery="${escape(p.id)}"><img src="${p.cover}" alt=""><span>${escape(p.title)}<small>${escape(p.type)}</small></span></button>`).join('');
edgeGlass=new EdgeGlass($('#projects'));
aboutLoop=new AboutLoop($('#about'));
const revealObserver=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting){e.target.classList.add('visible');revealObserver.unobserve(e.target);}}},{threshold:.08});
function reveal(){for(const el of $$('.page:not([hidden]) .reveal'))revealObserver.observe(el);}
function navigate(section,{updateHash=true}={}){
  if(!['creative','projects','about'].includes(section))section='creative';
  const same=current===section;
  removeCaseMedia();$('#case-view').hidden=true;document.body.classList.remove('case-mode');
  $('#main').inert=false;$('.header').inert=false;
  if($('#quick-view').open)$('#quick-view').close();
  for(const el of $$('.page'))el.hidden=el.id!==section;
  for(const a of $$('.navigation a')){if(a.dataset.section===section)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}
  current=section;sphere?.setActive(section==='creative');
  edgeGlass.setActive(section==='projects');aboutLoop.setActive(section==='about');
  document.body.classList.toggle('scroll-mode',section!=='creative');
  $('.page-index').textContent={creative:'001',projects:'002',about:'003'}[section];
  $('.motion-toggle').hidden=section!=='creative';
  for(const video of $$('#projects video'))if(section!=='projects')video.pause();
  if(section==='projects')observeVideos($('#projects'));
  if(updateHash&&location.hash!==`#${section}`)history.pushState(null,'',`#${section}`);
  if(!same||section==='creative')$('#gallery-index').hidden=true;
  reveal();
}
function route(){const hash=decodeURIComponent(location.hash.slice(1));if(hash.startsWith('case/')){const p=projects.concat(explorations).find(v=>v.id===hash.slice(5)||v.legacyId===hash.slice(5)||v.aliases?.includes(hash.slice(5)));if(p){navigate('projects',{updateHash:false});openCase(p,{updateHash:false});if(p.id!==hash.slice(5))history.replaceState(null,'',`#case/${p.id}`);return;}}navigate(hash||'creative',{updateHash:false});}
for(const a of $$('.navigation a'))a.addEventListener('click',e=>{e.preventDefault();navigate(a.dataset.section);});
$('.monogram').onclick=e=>{e.preventDefault();navigate('creative');};
$('.skip-link').onclick=e=>{e.preventDefault();$('#main').focus({preventScroll:true});};
for(const b of $$('[data-go]'))b.onclick=()=>navigate(b.dataset.go);
window.addEventListener('popstate',route);window.addEventListener('hashchange',route);
function setGalleryHover(item){$('#gallery-title').textContent=item?.title||'A space for ideas.';$('#gallery-category').textContent=item?item.type:'Drag to explore';if(item)cursorSet(true,'View');else cursorSet(false,'');}
function mountCursor(root){if(cursor.parentElement!==root)root.append(cursor);}
function openQuick(item){
  activeItem=item;lastFocus=document.activeElement;sphere?.setActive(false);
  const dlg=$('#quick-view');
  $('.quick-media').innerHTML=item.video?`<video src="${item.video}" autoplay muted loop playsinline aria-label="${escape(item.title)} 动态实验"></video>`:`<img src="${item.hero||item.cover}" alt="${escape(item.title)}">`;
  $('.quick-info h2').textContent=item.title;$('.quick-info p').textContent=item.type;
  $('.sample-note').textContent='';$('.sample-note').hidden=true;
  $('.quick-case').hidden=!projects.some(p=>p.id===item.id)&&item.id!=='glass';
  dlg.showModal();
  // A modal dialog is above every page z-index. Keep the same cursor in its top layer.
  mountCursor(dlg);cursorSet(false,'');
}
$('.quick-close').onclick=()=>$('#quick-view').close();$('#quick-view').addEventListener('close',()=>{mountCursor(document.body);cursorSet(false,'');$('.quick-media video')?.pause();sphere?.setActive(current==='creative');lastFocus?.focus?.({preventScroll:true});});
$('.quick-case').onclick=()=>{const p=projects.concat(explorations).find(p=>p.id===activeItem.id);$('#quick-view').close();openCase(p);};
for(const b of $$('[data-case]'))b.onclick=()=>openCase(projects.find(p=>p.id===b.dataset.case));
for(const b of $$('[data-explore]'))b.onclick=()=>openQuick(explorations.find(p=>p.id===b.dataset.explore));
for(const b of $$('[data-gallery]'))b.onclick=()=>openQuick(gallery.find(p=>p.id===b.dataset.gallery));
$('.gallery-access').onclick=()=>{$('#gallery-index').hidden=false;$('.index-heading button').focus();};$('.index-heading button').onclick=()=>{$('#gallery-index').hidden=true;$('.gallery-access').focus();};
function openCase(p,{updateHash=true}={}){
  if(!p)return;returnTo=current;previousHash=`#${current}`;
  const view=$('#case-view');if(view.hidden)caseReturnFocus=document.activeElement;removeCaseMedia();view.hidden=false;view.scrollTop=0;sphere?.setActive(false);edgeGlass.setActive(false);aboutLoop.setActive(false);for(const video of $$('#projects video'))video.pause();document.body.classList.add('case-mode');document.body.classList.remove('scroll-mode');
  $('#main').inert=true;$('.header').inert=true;
  $('#close-case').textContent=current==='creative'?'← Back to gallery':'← Back to projects';
  $('#case-number').textContent=String(Math.max(projects.indexOf(p)+1,1)).padStart(3,'0');
  const i=projects.indexOf(p),next=projects[(i+1)%projects.length];
  const copy=(paragraphs,lang)=>paragraphs.map(line=>`<p lang="${lang}">${escape(line.replace(/\uF0B7/g,'•'))}</p>`).join('');
  const story=copy(p.storyParagraphs||[p.story||'以材质与形式为起点，探索光线、构图与细节之间的关系。'],'zh-CN');
  const translation=p.englishParagraphs?.length?`<div class="case-translation">${copy(p.englishParagraphs,'en')}</div>`:'';
  const hero=p.video?{src:p.video,kind:'video',poster:p.hero||p.cover,alt:p.title+' 项目主视觉',fit:p.heroFit}:{src:p.hero||p.cover,alt:p.title+' 项目主视觉',fit:p.heroFit};
  const details=(p.images||[p.cover,p.cover]).map(item=>mediaMarkup(typeof item==='string'?{src:item,alt:p.title+' 设计细节'}:item,{detail:true})).join('');
  $('#case-content').innerHTML=`<div class="case-title"><span class="eyebrow">${projects.includes(p)?'Selected project':'Material exploration'}</span><h1>${escape(p.title)}</h1><p>${escape(p.type)}${p.role?`<br>${escape(p.role)}`:''}</p><p class="case-intro">${escape(p.description||'关于形式、材料与光线的视觉实验。')}</p></div><div class="case-cover">${mediaMarkup(hero,{detail:!!p.video})}</div><div class="case-text"><h2>${escape(p.heading||'A study in form.')}</h2><div class="case-copy">${story}${translation}</div></div><div class="case-detail-images">${details}</div><footer class="case-end"><span>Next project</span><button id="next-case">${escape(next.title)} ↗</button></footer>`;
  observeVideos($('#case-content'));
  $('#next-case').onclick=()=>openCase(next);$('#close-case').focus({preventScroll:true});
  if(updateHash)history.pushState(null,'',`#case/${p.id}`);
}
function closeCase(){navigate(returnTo,{updateHash:false});history.pushState(null,'',previousHash);caseReturnFocus?.focus?.({preventScroll:true});}
$('#close-case').onclick=closeCase;
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#case-view').hidden)closeCase();if(!$('#gallery-index').hidden){$('#gallery-index').hidden=true;$('.gallery-access').focus();}}});
const cursor=$('#cursor');let mx=-100,my=-100,cx=mx,cy=my;
function cursorSet(active,text){cursor.classList.toggle('active',active);cursor.querySelector('span').textContent=text;}
if(matchMedia('(hover: hover) and (pointer: fine)').matches&&!reduced){document.body.classList.add('custom-cursor');document.addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;cursor.style.opacity='1';});document.addEventListener('pointerover',e=>{const interactive=e.target.closest('a,button');if(interactive)cursorSet(true,interactive.dataset.case?'View':'');});document.addEventListener('pointerout',e=>{if(e.target.closest('a,button'))cursorSet(false,'');});document.documentElement.addEventListener('pointerleave',()=>cursor.style.opacity='0');const follow=()=>{cx+=(mx-cx)*.3;cy+=(my-cy)*.3;cursor.style.left=cx+'px';cursor.style.top=cy+'px';requestAnimationFrame(follow);};requestAnimationFrame(follow);}
try{sphere=new SphereGallery($('#sphere'),gallery,{onHover:setGalleryHover,onSelect:openQuick});}catch(error){console.warn('WebGL gallery fallback',error);const list=$('#sphere-fallback');list.hidden=false;$('#sphere').hidden=true;list.innerHTML=gallery.map(p=>`<button data-fallback="${p.id}" aria-label="${escape(p.title)}"><img src="${p.cover}" alt="${escape(p.title)}"></button>`).join('');for(const b of $$('[data-fallback]'))b.onclick=()=>openQuick(gallery.find(p=>p.id===b.dataset.fallback));$('#sphere-stage').classList.add('ready');}
$('.motion-toggle').setAttribute('aria-pressed',String(reduced));$('.motion-toggle').onclick=()=>{const pause=$('.motion-toggle').getAttribute('aria-pressed')!=='true';sphere?.setPaused(pause);$('.motion-toggle').setAttribute('aria-pressed',String(pause));$('.motion-toggle').setAttribute('aria-label',pause?'继续画廊自动旋转':'暂停画廊自动旋转');};
route();
