---
name: cmyk-to-rgb
description: 将 CMYK 色彩空间的图片（JPEG 等 4 通道图）转换为 RGB(sRGB)，支持单文件、目录、glob，输出 JPEG/PNG/WebP/AVIF。当用户提到图片偏色/发灰、CMYK 图片打不开、打印用图转网页用图、或把 .jpg 从 4 通道转成 3 通道时使用。图片如果本来就是 RGB，脚本会自动跳过（可用 --force 强制）。
---

# CMYK → RGB 图片转换

使用同目录下的 [`convert.mjs`](convert.mjs)（基于 Node.js + sharp）把 CMYK 色彩空间的图片转换为 RGB(sRGB)。

## 前置条件

- 本机需要 `node`（≥18）。skill 目录随仓库自带了 `package.json`，安装依赖：

  ```bash
  npm install
  ```

## 使用步骤

1. 确认图片是否为 CMYK：可用 `file <图片>` 查看 `components 4`，或直接跑转换脚本，脚本会自动检测（`space === 'cmyk'` 或 4 通道）。
2. 运行脚本转换。默认在输入图片同目录输出 `<原名>-rgb.<原扩展名>`：

   ```bash
   node convert.mjs "照片.jpg"
   ```

3. 常用变体：

   ```bash
   node convert.mjs -o ./rgb ./photos            # 目录内所有图片，输出到 ./rgb
   node convert.mjs 'images/**/*.jpg'            # glob 匹配
   node convert.mjs --format png "海报.jpg"       # 转成 PNG
   node convert.mjs -q 85 "海报.jpg"              # 调整 JPEG 质量（默认 92）
   node convert.mjs -f "奇怪.jpg"                 # 强制转换（即使不是 CMYK）
   ```

## 注意事项

- 脚本只转换 CMYK 图片，RGB 图片默认跳过；`-f/--force` 可强制转换。
- 转换使用 `toColourspace('srgb')`，依赖 embedded ICC 进行色彩管理；无 ICC 的 CMYK JPEG 按 Adobe CMYK 约定转换。
- 输出格式默认保持原格式；`--format jpeg|png|webp|avif` 可指定。
- 完整参数见 `node convert.mjs --help`。
