# Leon / 蓝彦士 — Portfolio

多领域创意设计师个人作品集。原生 HTML、CSS、JavaScript 与 WebGL，无需安装运行依赖。

## 预览

```sh
npm run dev
```

打开 http://127.0.0.1:4173/ 。

## 部署

GitHub Pages 使用 `.github/workflows/deploy-pages.yml` 将 `dist/` 发布为静态网站。推送到 `main` 时自动检查并部署，也可在 Actions 中手动运行。

首次在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。

网站地址：https://ckorgebens.github.io/special-succotash/

## 内容维护

- `dist/data.js`：项目、探索和球面画廊的名称、简介及素材对应关系。
- `dist/project-copy.js`：用户提供的完整中英文案例文案。
- `dist/index.html`：身份、About 原文、联系方式与网站元数据。
- `dist/assets/leon/`：个人作品图片、视频和浏览器图标的网页副本。
- `dist/style.css` / `dist/effects.css`：编辑排版、响应式样式与显示层。
- `dist/sphere.js`：球面画廊与拖动、惯性、透视交互。
- `dist/edge-glass.js`：屏幕上下边缘玻璃折射与色散。
- `dist/about-loop.js`：中心模型、整行文字绕排与双向循环滚动。

运行 `npm run check` 验证 JavaScript 语法和素材路径。资源使用相对路径，兼容本地根地址、GitHub Pages 项目子目录及自定义域名。

## 设计及素材来源

视觉参考：[Gionatan Nese](https://www.gionatannese.com/)。前三个项目来自 Leon 提供并审核的文件夹；保留的 Ferrari、Erica、部分探索、字体及 About 模型来自参考网站，来源在 `data.js` 的 `reference` 字段登记。Three.js 0.180.0 随网站本地提供，许可位于 `dist/vendor/three/LICENSE`。

原始 DOCX、大尺寸源视频、制作过程文件和本地研究记录不包含在发布文件中。
