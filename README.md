# 江上清风 · 静态个人主页

参照设计稿制作，深蓝古典风格，适配桌面与手机端。

## 目录结构

```
jiangshang/
├── index.html          主页面
├── styles.css          样式（含响应式）
├── script.js           动态加载视频与手记
├── videos/             视频资源（独立存放）
│   ├── manifest.json   视频清单（编辑此文件来增删视频）
│   └── README.md
└── notes/              手记日志（独立存放）
    ├── manifest.json   手记清单
    ├── 01-*.md         Markdown 手记
    └── README.md
```

## 启动

由于浏览器对 `file://` 直接读取本地 JSON 有限制，请在本目录启动一个本地服务：

```bash
cd jiangshang
python3 -m http.server 8000
```

然后浏览器访问 `http://localhost:8000`。

直接双击 `index.html` 也能看到页面，但视频与手记列表会回落到内置示例数据。

## 新增视频

1. 把视频文件（如 `mysong.mp4`）放进 `videos/` 文件夹。
2. 编辑 `videos/manifest.json`，添加一项：

   ```json
   { "title":"标题", "desc":"简介", "cover":"封面URL或本地路径", "src":"mysong.mp4" }
   ```

## 新增手记

1. 把 `.md` 文件放进 `notes/` 文件夹。
2. 编辑 `notes/manifest.json`，添加一项：

   ```json
   { "title":"标题", "date":"2026-05-10", "file":"my-note.md" }
   ```

## 适配说明

- ≥ 901px：桌面三栏布局（视频 3 列、手记左右分栏）
- 641–900px：平板布局（视频 2 列、手记上下排列）
- ≤ 640px：手机布局（菜单折叠、视频 1 列、字号自适应）
