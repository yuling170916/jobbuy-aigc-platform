// 演示模式出图引擎：用 Canvas 确定性地生成"商品场景图"占位图
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

/** 根据种子 + LoRA 场景，确定性生成一张 480px 场景图（dataURL） */
export function demoImage(seed: number, lora: LoraModel, productEmoji: string): string {
  const key = `${seed}-${lora.id}-${productEmoji}`;
  if (cache.has(key)) return cache.get(key)!;

  const rand = mulberry32(seed);
  const size = 480;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 背景：场景渐变 + 随机角度
  const angle = rand() * Math.PI * 2;
  const x1 = size / 2 + Math.cos(angle) * size, y1 = size / 2 + Math.sin(angle) * size;
  const g = ctx.createLinearGradient(size / 2, size / 2, x1, y1);
  g.addColorStop(0, lora.palette[0]);
  g.addColorStop(1, lora.palette[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // 场景装饰：随机几何块（模拟场景元素）
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

  // 台面光影（产品摆放面）
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(size / 2, size * 0.78, size * 0.36, size * 0.10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 产品主体
  ctx.font = `${size * 0.34}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(productEmoji, size / 2, size * 0.55);

  // 角落场景标签（模拟水印位）
  ctx.font = `600 ${size * 0.038}px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`${lora.name} ${lora.version}`, size * 0.05, size * 0.08);
  ctx.textAlign = 'right';
  ctx.fillText('Jobbuy AIGC', size * 0.95, size * 0.94);

  const url = canvas.toDataURL('image/jpeg', 0.82);
  if (cache.size > 300) cache.clear();
  cache.set(key, url);
  return url;
}

// ---------- 文本线：引流标题 / 详情文案（演示规则引擎，可替换为 LLM API） ----------

const TITLE_TEMPLATES = [
  (n: string, p: string) => `${p}，${n} 限时特惠`,
  (n: string, p: string) => `海外爆款 ${n}｜${p}`,
  (n: string, p: string) => `${n}：${p}，买它就够了`,
  (n: string, p: string) => `为什么海外买家都在抢这款${n}？${p}`,
  (n: string, p: string) => `${p} · ${n}，今日上新`,
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
