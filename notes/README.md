# 手记文件夹

把你写的 Markdown 手记（`.md` 文件）放进此文件夹，然后在 `manifest.json` 中添加对应条目：

```json
[
  {
    "title": "标题",
    "date":  "2026-05-10",
    "file":  "my-note.md"
  }
]
```

字段说明：

- `title`：在侧栏显示的标题
- `date`：日期（任意格式字符串）
- `file`：相对于本文件夹的 `.md` 文件名

写作语法支持标准 Markdown（标题、列表、引用、代码块、链接、图片等）。
