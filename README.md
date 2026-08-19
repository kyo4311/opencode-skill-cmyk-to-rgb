# cmyk-to-rgb

> opencode skill：把 CMYK 色彩空间的图片（JPEG 等 4 通道图）转换成 RGB(sRGB)。

基于 Node.js + [sharp](https://sharp.pixelplumbing.com/)。支持单文件 / 目录 / glob，输出 JPEG / PNG / WebP / AVIF。RGB 图片自动跳过（可用 `--force` 强制），像素与尺寸保持不变。

## 安装

**前置条件**：本机已安装 [Node.js](https://nodejs.org/) ≥ 18。

仓库根目录即是一个 skill（`SKILL.md` 直接在根下），因此 clone 到 opencode 的标准 skill 目录即可被自动加载，**无需复制、无需配置 `skills.paths`**。

### 方式一：clone 到标准 skill 目录（推荐）

```bash
# 全局可用（所有项目）
git clone https://github.com/kyo4311/opencode-skill-cmyk-to-rgb.git ~/.config/opencode/skills/cmyk-to-rgb

# 或仅当前项目可用
git clone https://github.com/kyo4311/opencode-skill-cmyk-to-rgb.git <项目>/.opencode/skills/cmyk-to-rgb
```

### 方式二：复制文件到项目

```bash
git clone https://github.com/kyo4311/opencode-skill-cmyk-to-rgb.git
mkdir -p <项目>/.opencode/skills/cmyk-to-rgb
cp -R cmyk-to-rgb/SKILL.md cmyk-to-rgb/convert.mjs cmyk-to-rgb/package*.json <项目>/.opencode/skills/cmyk-to-rgb/
```

### 方式三：任意目录 + `skills.paths`

clone 到任意位置，在 `opencode.json` 里指向它。**注意**：目标目录名需为 `cmyk-to-rgb`（opencode 要求 skill 名与所在目录名一致），且该目录中要有 `SKILL.md`：

```bash
git clone https://github.com/kyo4311/opencode-skill-cmyk-to-rgb.git ~/skills/cmyk-to-rgb
```

```json
{
  "$schema": "https://opencode.ai/config.json",
  "skills": {
    "paths": ["~/skills/cmyk-to-rgb"]
  }
}
```

### 安装依赖

仓库**不内置** `node_modules`（已 gitignore，依赖按平台/架构区分，不应入库）。装好后需在 skill 目录执行一次：

```bash
cd <skill 目录> && npm install
```

安装完成后**重启 opencode**，skill 生效。

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

- **检测**：`sharp.metadata()` 判断 `space === 'cmyk'` 或通道数 `=== 4`。
- **转换**：`toColourspace('srgb')`，依赖 embedded ICC 做色彩管理；无 ICC 的 CMYK JPEG 按 Adobe CMYK 约定转换。
- **编码**：用 mozjpeg 等编码器重新压缩，大色块平涂图体积通常大幅缩小（像素与尺寸不变）。

## 常见问题

**为什么转换后文件变小很多？**
原文件多为设计/画板软件导出的 CMYK、baseline、未优化 JPEG，压缩率低；重编码 + 去掉 ICC 元数据后体积自然缩小，属正常现象。想保留更大体积可 `-q 100` 或 `--format png`（无损）。

## License

MIT
