// Personal projects are imported from the user's reviewed content folders.
// reference:true records are retained reference assets; provenance is kept here.
import {caseCopy} from './project-copy.js';
const A='./assets/';
const L=A+'leon/';
const image=(name,alt)=>({src:L+name,alt,fit:'contain'});
const motion=(name,alt)=>({src:L+name+'.mp4',poster:L+name+'-poster.webp',kind:'video',alt,fit:'contain'});
export const projects=[
  {
    id:'digital-identity',legacyId:'tengile',title:'数字身份多媒体影像设计',type:'Multimedia & Motion Design',
    cover:L+'digital-cover-poster.webp',hero:L+'digital-cover-poster.webp',video:L+'digital-cover.mp4',coverFit:'contain',heroFit:'contain',
    description:'通过多媒体影像，探索个体、平台与社会结构如何共同塑造数字身份与自我认知。',
    heading:'互联网形象与自我认知',storyParagraphs:caseCopy.digital.chinese,englishParagraphs:caseCopy.digital.english,
    images:[image('digital-identity.webp','数字身份：平台界面与人物形象'),motion('digital-portrait','数字身份：人像识别与检测框动态影像'),image('digital-tree.webp','数字身份：被数字界面切分的树木'),motion('digital-tree','数字身份：树木与对话框动态影像'),image('digital-folders.webp','数字身份：文件夹阵列视觉'),motion('digital-recognition','数字身份：人机识别动态影像')],reference:false,
  },
  {
    id:'miniso-hainan',legacyId:'identity',title:'MINISO海南线下快闪',type:'IP Design · 3D & Spatial Design',
    cover:L+'miniso-store.webp',hero:L+'miniso-store.webp',coverFit:'contain',heroFit:'contain',role:'MINISO 实习 · 团队项目',
    description:'以墩墩鸡 IP 串联夏日海岛场景、盲盒潮玩与周边产品，完成从角色到场景的视觉整合。',
    heading:'核心内容拆解',storyParagraphs:caseCopy.miniso.chinese,englishParagraphs:caseCopy.miniso.english,
    images:[image('miniso-pool.webp','MINISO：夏日海岛泳池装置'),image('miniso-chair.webp','MINISO：海边救生椅陈列架'),image('miniso-products.webp','MINISO：墩墩鸡产品形象'),image('miniso-accessories.webp','MINISO：海岛场景及周边元素'),image('miniso-scrunchies.webp','MINISO：夏日主题发圈产品'),image('miniso-store.webp','MINISO：快闪店铺场景')],reference:false,
  },
  {
    id:'gafa-2026',legacyId:'anchor',aliases:['gafa-2025'],title:'2026毕业主视觉网页设计',type:'Key Visual & Website Design',
    cover:L+'graduation-cover.webp',hero:L+'graduation-cover.webp',coverFit:'contain',heroFit:'contain',role:'主视觉效果图渲染 · 官方展示网页搭建',
    description:'为广州美术学院毕业设计展完成主视觉渲染与官方网页搭建，连接线下展览与线上数字展示。',
    heading:'从主视觉到数字展览',storyParagraphs:caseCopy.graduation.chinese,englishParagraphs:caseCopy.graduation.english,
    images:Array.from({length:7},(_,i)=>image(`graduation-screen-${String(i+1).padStart(2,'0')}.webp`,`广州美术学院毕业展网页：界面 ${i+1}`)),reference:false,
  },
  {id:'ferrari',title:'Ferrari 330 P4',type:'Digital Design Exploration',cover:A+'automotive-wide.webp',hero:A+'automotive-wide.webp',images:[A+'automotive.webp',A+'automotive-detail.webp'],description:'以数字叙事重新观察经典造型，让影像、运动与交互共同表达。',story:'从一个经典对象出发，观察比例、曲线与细节。通过大幅影像与编辑式排版，建立具有沉浸感的阅读路径，在视觉张力与信息清晰之间保持平衡。',heading:'Heritage, reimagined.',reference:true},
  {id:'erica',title:'Erica Basile',type:'Art Direction & Editorial Design',cover:A+'editorial-wide.webp',hero:A+'editorial-wide.webp',images:[A+'editorial.jpg',A+'editorial-cover.webp'],description:'围绕生长与变化建立视觉叙事，将细微的情感融入纸面。',story:'以生长作为视觉线索，让图形在不同页面间缓慢演变。纸张、图像与字体的关系构成安静的阅读体验，保留叙事的情绪与呼吸感。',heading:'The quiet art of becoming.',reference:true},
];
export const explorations=[
  {id:'glass',title:'Liquid Form',type:'3D Material Study',cover:A+'glass-study.png',hero:A+'glass-study.png',description:'浅青色玻璃、有机轮廓与柔和光线。',story:'这张材质实验图像来自工作区。通过浅色背景、柔和的高光与有机形态，探索透明材质的视觉表达。',heading:'Between light & form.',images:[A+'glass-study.png',A+'glass-study.png'],reference:false},
  {id:'athena',title:'Athena',type:'3D Form Exploration',cover:A+'athena.webp',hero:A+'athena.webp',reference:true},
  {id:'minerals',title:'Minerals',type:'Procedural Material Study',cover:A+'minerals.jpg',hero:A+'minerals.jpg',reference:true},
  {id:'still-life',title:'Still Life',type:'Visual Composition',cover:A+'still-life.webp',hero:A+'still-life.webp',reference:true},
  {id:'blob',title:'Blob',type:'3D Motion Exploration',cover:A+'minerals.jpg',video:A+'blob.webm',hero:A+'minerals.jpg',reference:true},
  {id:'modercromo',title:'Modercromo',type:'3D Material & Motion',cover:A+'still-life-2.webp',video:A+'modercromo.webm',hero:A+'still-life-2.webp',reference:true},
];
export const gallery=[
  projects[0],
  projects[1],
  {id:'craft',title:'Neshamah',type:'Visual Identity',cover:A+'craft.jpg',hero:A+'craft.jpg',reference:true},
  projects[2],
  explorations[0],
  {...projects[4],cover:A+'editorial.jpg'},
  {...projects[3],cover:A+'automotive.webp'},
  explorations[1],
  explorations[2],
  explorations[3],
  explorations[4],
  {...projects[3],cover:A+'automotive-detail.webp'},
  explorations[5],
  {...projects[2],cover:L+'graduation-screen-01.webp'},
  {id:'rosa-detail',title:'Rosa',type:'Brand Exploration',cover:A+'rosa-2.jpg',hero:A+'rosa-2.jpg',reference:true},
  {...projects[1],cover:L+'miniso-pool.webp'},
  {...projects[4],cover:A+'editorial-cover.webp'},
  {...explorations[0],title:'Glass / 02'},
  {...projects[3],cover:A+'automotive-wide.webp'},
  {...projects[2],cover:L+'graduation-screen-04.webp'},
  {id:'touch',title:'TouchDesigner',type:'Generative Motion Study',cover:A+'rosa.jpg',hero:A+'rosa.jpg',video:A+'touch.webm',reference:true},
];
