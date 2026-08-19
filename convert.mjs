#!/usr/bin/env node
import sharp from 'sharp'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { glob } from 'node:fs/promises'

const SUPPORTED = new Set(['jpeg', 'jpg', 'png', 'webp', 'tiff', 'tif', 'avif'])
const CMYK_SPACES = new Set(['cmyk'])

function parseArgs(argv) {
  const opts = { inputs: [], outDir: null, force: false, verbose: false, format: null, quality: 92 }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    switch (a) {
      case '-o':
      case '--out-dir':
        opts.outDir = argv[++i]
        break
      case '--format':
        opts.format = argv[++i]
        break
      case '-q':
      case '--quality':
        opts.quality = Number(argv[++i])
        break
      case '-f':
      case '--force':
        opts.force = true
        break
      case '-v':
      case '--verbose':
        opts.verbose = true
        break
      case '-h':
      case '--help':
        opts.help = true
        break
      default:
        if (a.startsWith('-')) {
          console.error(`未知参数: ${a}`)
          process.exit(2)
        }
        opts.inputs.push(a)
    }
  }
  return opts
}

async function isCmyk(file) {
  const meta = await sharp(file).metadata()
  return CMYK_SPACES.has(meta.space) || meta.channels === 4
}

async function collectFiles(inputs) {
  const files = []
  for (const input of inputs) {
    let st
    try {
      st = await stat(input)
    } catch {
      const matches = []
      for await (const f of glob(input, { nodir: true })) matches.push(f)
      if (matches.length === 0) {
        console.error(`输入不存在: ${input}`)
        continue
      }
      files.push(...matches)
      continue
    }
    if (st.isDirectory()) {
      const entries = await readdir(input)
      for (const e of entries) {
        const full = path.join(input, e)
        if (SUPPORTED.has(path.extname(e).slice(1).toLowerCase())) files.push(full)
      }
    } else if (st.isFile()) {
      files.push(input)
    }
  }
  return files
}

async function convert(file, opts) {
  if (!SUPPORTED.has(path.extname(file).slice(1).toLowerCase())) {
    if (opts.verbose) console.log(`跳过（不支持格式）: ${file}`)
    return { file, status: 'skip-format' }
  }

  const cmyk = opts.force || (await isCmyk(file))
  if (!cmyk) {
    if (opts.verbose) console.log(`跳过（非 CMYK）: ${file}`)
    return { file, status: 'skip-rgb' }
  }

  const dir = opts.outDir ? path.resolve(opts.outDir) : path.dirname(file)
  const ext = opts.format ? `.${opts.format.replace(/^\./, '')}` : path.extname(file).toLowerCase()
  const base = path.basename(file, path.extname(file))
  const out = path.join(dir, `${base}-rgb${ext}`)

  const pipeline = sharp(file).toColourspace('srgb')
  if (ext === '.png') pipeline.png({ compressionLevel: 9 })
  else if (ext === '.webp') pipeline.webp({ quality: opts.quality })
  else if (ext === '.avif') pipeline.avif({ quality: opts.quality })
  else pipeline.jpeg({ quality: opts.quality, mozjpeg: true })

  await pipeline.toFile(out)
  console.log(`已转换: ${file} -> ${out}`)
  return { file, status: 'ok', out }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.help || opts.inputs.length === 0) {
    console.log(`用法: node convert.mjs [选项] <图片|目录|glob>...

将 CMYK 图片转换为 RGB(sRGB)。
如果输出目录不存在会自动创建。

选项:
  -o, --out-dir <dir>   输出目录（默认与输入同目录）
      --format <ext>    输出格式: jpeg | png | webp | avif（默认保持原格式）
  -q, --quality <num>   输出质量 1-100（默认 92）
  -f, --force           强制转换所有图片（不过滤 CMYK）
  -v, --verbose         显示更多日志
  -h, --help            显示帮助

示例:
  node convert.mjs photo.jpg
  node convert.mjs -o ./rgb ./photos
  node convert.mjs --format png 'images/**/*.jpg'`)
    process.exit(opts.help ? 0 : 2)
  }

  const files = await collectFiles(opts.inputs)
  if (files.length === 0) {
    console.error('没有找到可处理的图片')
    process.exit(1)
  }

  if (opts.outDir) {
    const { mkdir } = await import('node:fs/promises')
    await mkdir(path.resolve(opts.outDir), { recursive: true })
  }

  const results = []
  for (const f of files) {
    try {
      results.push(await convert(f, opts))
    } catch (err) {
      console.error(`转换失败: ${f} — ${err.message}`)
      results.push({ file: f, status: 'error', error: err.message })
    }
  }

  const ok = results.filter((r) => r.status === 'ok').length
  const skipped = results.filter((r) => r.status.startsWith('skip')).length
  const failed = results.filter((r) => r.status === 'error').length
  console.log(`\n完成: 转换 ${ok} 个, 跳过 ${skipped} 个, 失败 ${failed} 个`)
  if (failed > 0) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
