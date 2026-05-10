# 视频文件夹

视频可以是**本地文件**，也可以是**外部平台链接**。在 `manifest.json` 中按下面格式配置即可。

## 通用字段

```json
{
  "title":      "视频标题",
  "desc":       "一段简介",
  "cover":      "封面图（本地文件名 / videos/相对路径 / 外链 URL）",
  "src":        "本地文件名 或 外链 URL",
  "type":       "可选：'video' / 'iframe' 强制覆盖自动识别",
  "openInPage": "可选：true(默认) 在站内弹窗预览；false 直接跳转外链"
}
```

- `cover` / `src` 写**纯文件名**（如 `waipo.png`、`waipoa.MOV`）会自动加 `videos/` 前缀；
  若已是完整 URL（`http://...`）或绝对路径（`/...`）则原样使用。
- `src` 留空 → 网页仍显示该卡片，点击会提示"尚未上传"。
- 自动识别规则：
  - `*.mp4 / .webm / .ogg / .mov / .m4v` → 本地直链播放
  - 其它 `http(s)://...` 链接 → 用 iframe 嵌入

### 关于 `openInPage`

| 值 | 行为 | 适合场景 |
| --- | --- | --- |
| `true` (默认) | 站内弹窗预览（`<video>` 或 iframe） | YouTube / Bilibili / Vimeo / 本地文件 |
| `false` | 点击卡片直接 `window.open` 跳转外链 | 微信视频号短链等无法嵌入的来源 |

当 `openInPage: false` 时卡片右上角会显示「外链跳转」角标，▶ 也会换成 ↗。

## 已支持的外部平台

| 平台 | 你只需粘贴 | 自动转换为 |
| --- | --- | --- |
| **本地文件** | `waipoa.mp4` | `<video>` 直接播放 |
| **Bilibili** | `https://www.bilibili.com/video/BV1xx411x7xx` | `player.bilibili.com/player.html?bvid=...` |
| **Bilibili (av)** | `https://www.bilibili.com/video/av170001` | `player.bilibili.com/player.html?aid=...` |
| **YouTube** | `https://youtube.com/watch?v=ID`、`youtu.be/ID`、`/shorts/ID` | `youtube.com/embed/ID` |
| **Vimeo** | `https://vimeo.com/76979871` | `player.vimeo.com/video/76979871` |
| **微信视频号** | `https://channels.weixin.qq.com/share/video/...` | 直接 iframe（请使用"嵌入分享"得到的链接） |
| **其它网页** | 任意 `http(s)://...` | 默认作为 iframe 嵌入 |

## 一些细节

- **B 站分 P**：原 URL 带 `?p=2` 时会自动保留分 P。
- **微信视频号**：必须用官方"嵌入分享"功能拿到的 URL，普通分享链接不能跨域嵌入。
- **YouTube / 部分外链**：在中国大陆可能无法访问，属于网络环境问题。
- **HTTPS**：本站若部署到 HTTPS，外链也最好是 HTTPS，否则浏览器会拦截 mixed content。

## 启动

```bash
cd jiangshang
python3 -m http.server 8000
# 浏览器访问 http://localhost:8000
```
