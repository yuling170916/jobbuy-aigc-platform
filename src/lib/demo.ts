// 演示模式出图引擎：用 Canvas 确定性地生成"商品场景图"
// 真实模式下由 ComfyUI + LoRA 出图（见 comfyui.ts），这里仅用于无 GPU 环境演示流程
import type { LoraModel } from '@/types';

/** 简单的字符串哈希 → 随机种子 */
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** 可复现的伪随机数 */
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cache = new Map<string, string>();

export type ProductPos = 'center' | 'left' | 'right' | 'bottom';
const POS: Record<ProductPos, [number, number]> = {
  center: [0.5, 0.55], left: [0.28, 0.55], right: [0.7, 0.55], bottom: [0.5, 0.66],
};

/** 根据种子 + LoRA 场景，确定性生成一张场景底图（dataURL） */
export function demoImage(seed: number, lora: LoraModel, productEmoji: string, pos: ProductPos = 'center'): string {
  const key = `${seed}-${lora.id}-${productEmoji}-${pos}`;
  if (cache.has(key)) return cache.get(key)!;

  const rand = mulberry32(seed);
  const size = 480;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const angle = rand() * Math.PI * 2;
  const g = ctx.createLinearGradient(size / 2, size / 2, size / 2 + Math.cos(angle) * size, size / 2 + Math.sin(angle) * size);
  g.addColorStop(0, lora.palette[0]);
  g.addColorStop(1, lora.palette[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 6; i++) {
    ctx.globalAlpha = 0.10 + rand() * 0.12;
    ctx.fillStyle = rand() > 0.5 ? '#ffffff' : '#000000';
    const w = 40 + rand() * 140;
    if (rand() > 0.5) {
      ctx.beginPath();
      ctx.arc(rand() * size, rand() * size, w / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(rand() * size, rand() * size, w, w * (0.4 + rand()));
    }
  }
  ctx.globalAlpha = 1;

  // 台面光影
  const [px, py] = POS[pos];
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(size * px, size * (py + 0.2), size * 0.3, size * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 产品主体
  ctx.font = `${size * 0.3}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(productEmoji, size * px, size * py);

  const url = canvas.toDataURL('image/jpeg', 0.82);
  if (cache.size > 400) cache.clear();
  cache.set(key, url);
  return url;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

export interface AdSpec {
  title: string;      // 主标题
  subtitle: string;   // 副标题
  cta: string;        // 点击引导按钮文字
  template: 'left' | 'right' | 'top'; // 版式：左文右图 / 右文左图 / 上文下图
  textColor: string;
  ctaColor: string;
}

/** 按像素宽度换行：英文按单词断行，中文按字断行 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const isCJK = /[一-鿿]/.test(text);
  const units = isCJK ? text.split('') : text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const u of units) {
    const next = isCJK ? cur + u : (cur ? cur + ' ' + u : u);
    if (ctx.measureText(next).width <= maxWidth || !cur) {
      cur = next;
    } else {
      lines.push(cur);
      cur = u;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines;
}

/** 图文布局生成：背景图 + 主标题/副标题/点击引导 自动排版（文章 02 部分） */
export async function composeAdImage(seed: number, lora: LoraModel, productEmoji: string, spec: AdSpec): Promise<string> {
  const posMap: Record<AdSpec['template'], ProductPos> = { left: 'right', right: 'left', top: 'bottom' };
  const bg = await loadImg(demoImage(seed, lora, productEmoji, posMap[spec.template]));

  const S = 800;
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bg, 0, 0, S, S);

  const { title, subtitle, cta, template, textColor, ctaColor } = spec;

  // 文本块定位与可用宽度
  let tx: number, align: CanvasTextAlign, startY: number, maxW: number;
  if (template === 'left') { tx = 70; align = 'left'; startY = S * 0.26; maxW = S * 0.44; }
  else if (template === 'right') { tx = S - 70; align = 'right'; startY = S * 0.26; maxW = S * 0.44; }
  else { tx = S / 2; align = 'center'; startY = S * 0.13; maxW = S * 0.8; }

  ctx.textAlign = align;
  ctx.fillStyle = textColor;

  // 主标题（自动换行，最多 3 行）
  ctx.font = `700 68px "Helvetica Neue", "PingFang SC", sans-serif`;
  const titleLines = wrapText(ctx, title, maxW, 3);
  titleLines.forEach((line, i) => ctx.fillText(line, tx, startY + i * 80));

  // 分隔线（衬底元素规范）
  const lineY = startY + (titleLines.length - 1) * 80 + 26;
  ctx.fillRect(align === 'center' ? tx - 45 : align === 'right' ? tx - 90 : tx, lineY, 90, 5);

  // 副标题（自动换行，最多 2 行）
  ctx.font = `400 32px "Helvetica Neue", "PingFang SC", sans-serif`;
  const subLines = wrapText(ctx, subtitle, maxW, 2);
  subLines.forEach((line, i) => ctx.fillText(line, tx, lineY + 56 + i * 46));

  // 点击引导按钮
  const ctaY = lineY + 56 + (subLines.length - 1) * 46 + 36;
  ctx.font = `600 30px "Helvetica Neue", "PingFang SC", sans-serif`;
  const tw = ctx.measureText(cta).width;
  const bw = tw + 100, bh = 66;
  const bx = align === 'center' ? tx - bw / 2 : align === 'right' ? tx - bw : tx;
  ctx.fillStyle = ctaColor;
  ctx.beginPath();
  ctx.roundRect(bx, ctaY, bw, bh, bh / 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(`${cta} ›`, bx + bw / 2, ctaY + bh / 2 + 11);

  return canvas.toDataURL('image/png');
}

// ---------- WCAG 2 对比度（文章「配色规范」：正文 >4.5:1，标题 >3:1） ----------
function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg: string, bg: string): number {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

// ---------- 文本线：引流标题 / 详情文案（演示规则引擎，可替换为 LLM API） ----------

const TITLE_TEMPLATES = [
  (n: string, p: string) => `${p}${n}`,
  (n: string, p: string) => `${n} ${p}`,
  (n: string, p: string) => `${p} 就选${n}`,
  (n: string, _p: string) => `${n} 焕新上市`,
  (n: string, _p: string) => `品质${n} 口碑之选`,
];

export function generateCopy(skuName: string, points: string[]): { titles: string[]; detail: string } {
  const p = points.filter(Boolean);
  const main = p[0] || '品质好物';
  const titles = TITLE_TEMPLATES.map((t, i) => t(skuName, p[i % Math.max(p.length, 1)] || main));
  const detail = [
    `【核心卖点】${p.join('；') || main}`,
    `【场景描述】无论是日常使用还是送礼，${skuName}都能胜任。`,
    `【品质承诺】Jobbuy 海外仓直发，支持 30 天无理由退换。`,
  ].join('\n');
  return { titles, detail };
}

// ---------- 英文文案（海外站成品图专用：首焦图上的主标题/副标题/CTA 用英文） ----------

const TITLE_TEMPLATES_EN = [
  (_n: string, p: string) => p,
  (n: string, _p: string) => `${n}`,
  (n: string, p: string) => `${p} with ${n}`,
  (n: string, _p: string) => `New Arrival: ${n}`,
  (n: string, p: string) => `${n} — ${p}`,
];

export function generateCopyEn(skuNameEn: string, pointsEn: string[]): { titles: string[]; detail: string } {
  const p = pointsEn.filter(Boolean);
  const main = p[0] || 'Quality Pick';
  const titles = TITLE_TEMPLATES_EN.map((t, i) => t(skuNameEn, p[i % Math.max(p.length, 1)] || main));
  const detail = [
    `Highlights: ${p.join(' · ') || main}`,
    `Perfect for daily use or as a gift — ${skuNameEn} fits every moment.`,
    `Shipped from Jobbuy overseas warehouses. 30-day free returns.`,
  ].join('\n');
  return { titles, detail };
}
