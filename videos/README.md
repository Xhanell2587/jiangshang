# 视频文件夹

将你的视频文件（如 `.mp4`、`.webm`）放在此文件夹内，然后在 `manifest.json` 中添加或修改条目：

```json
[
  {
    "title": "视频标题",
    "desc":  "一段简介",
    "cover": "封面图片地址（本地相对路径或外链）",
    "src":   "my-video.mp4"
  }
]
```

字段说明：

- `title`：视频标题
- `desc`：简介（可选）
- `cover`：封面图，可填本地路径如 `covers/a.jpg`，也可填网络地址
- `src`：视频文件相对路径或完整 URL；留空则表示"待上传"

> 网页打开时若用 `file://` 协议，部分浏览器不允许 fetch 本地 JSON。
> 推荐使用：`python3 -m http.server 8000`，然后访问 `http://localhost:8000`。
