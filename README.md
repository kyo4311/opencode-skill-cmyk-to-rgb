# cmyk-to-rgb

opencode skill：将 CMYK 色彩空间的图片（JPEG 等 4 通道图）转换为 RGB(sRGB)。

基于 Node.js + [sharp](https://sharp.pixelplumbing.com/)，支持单文件、目录、glob，输出 JPEG / PNG / WebP / AVIF。RGB 图片会自动跳过（可用 `--force` 强制转换）。

## 安装

本项目仓库根目录即是一个 skill（`.opencode/skills/cmyk-to-rgb/` 同构）。安装方式任选其一：

**方式一：clone 后复制到项目 skill 目录**

```bash
git clone <repo-url>
cp -R cmyk-to-rgb/. <你的项目>/.opencode/skills/cmyk-to-rgb/
```

**方式二：通过 opencode `skills.paths` 引用（无需复制）**

在 `opencode.json` 中添加：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "skills": {
    "paths": ["/绝对路径/cmyk-to-rgb"]
  }
}
```

> 依赖：skill 目录内置了 `sharp` 的 `node_modules`，clone 后即开即用；如需重装依赖，在 skill 目录执行 `npm install`。

安装后需重启 opencode 生效。

## 使用

```bash
node convert.mjs "照片.jpg"                      # 输出 照片-rgb.jpg（同目录）
node convert.mjs -o ./rgb ./photos               # 目录内所有图片 → ./rgb
node convert.mjs 'images/**/*.jpg'               # glob 匹配
node convert.mjs --format png "海报.jpg"          # 输出 PNG
node convert.mjs -q 85 "海报.jpg"                 # JPEG 质量（默认 92）
node convert.mjs -f "奇怪.jpg"                    # 强制转换（即使不是 CMYK）
```

### 参数

| 参数 | 说明 |
| --- | --- |
| `-o, --out-dir <dir>` | 输出目录（默认与输入同目录） |
| `--format <ext>` | 输出格式：`jpeg` / `png` / `webp` / `avif`（默认保持原格式） |
| `-q, --quality <num>` | 输出质量 1-100（默认 92） |
| `-f, --force` | 强制转换所有图片，不过滤 CMYK |
| `-v, --verbose` | 显示更多日志 |
| `-h, --help` | 显示帮助 |

## 工作原理

- 检测：`sharp.metadata()` 判断 `space === 'cmyk'` 或通道数 `=== 4`。
- 转换：`toColourspace('srgb')`，依赖 embedded ICC 进行色彩管理；无 ICC 的 CMYK JPEG 按 Adobe CMYK 约定转换。
- 编码：重新用 mozjpeg 等编码器压缩，大色块平涂图通常体积大幅缩小（像素与尺寸不变）。
