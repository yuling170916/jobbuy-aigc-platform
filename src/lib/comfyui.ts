// ComfyUI API 适配器
// 对应文章：技术同学"编写工程文件、预留 SD 的 API 接口"
// 原理：工程文件（workflow JSON）里只有 ③正向词 ④反向词 ⑤数量 三个口是活的，
//       后端按需求表每一行替换这三个口，POST 给 ComfyUI 的 /prompt 接口出图。
import type { DemandRow } from '@/types';

/** 内置工程文件（与交付的 jobbuy_电商主图_ComfyUI工作流_中文版.json 同构，API 格式） */
export const WORKFLOW_TEMPLATE: Record<string, unknown> = {
  "1": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "sd_xl_base_1.0.safetensors" } },
  "2": { "class_type": "LoraLoader", "inputs": { "model": ["1", 0], "clip": ["1", 1], "lora_name": "jobbuy_style_lora.safetensors", "strength_model": 0.8, "strength_clip": 0.8 } },
  "3": { "class_type": "CLIPTextEncode", "inputs": { "clip": ["2", 1], "text": "{{PROMPT}}" } },
  "4": { "class_type": "CLIPTextEncode", "inputs": { "clip": ["2", 1], "text": "{{NEGATIVE}}" } },
  "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 1024, "batch_size": 4 } },
  "6": { "class_type": "KSampler", "inputs": { "model": ["2", 0], "positive": ["3", 0], "negative": ["4", 0], "latent_image": ["5", 0], "seed": 0, "steps": 25, "cfg": 7, "sampler_name": "euler", "scheduler": "normal", "denoise": 1 } },
  "7": { "class_type": "VAEDecode", "inputs": { "samples": ["6", 0], "vae": ["1", 2] } },
  "8": { "class_type": "SaveImage", "inputs": { "images": ["7", 0], "filename_prefix": "Jobbuy/product" } }
};

/** 按需求表的一行，生成可提交给 ComfyUI 的 prompt 负载（替换三个口） */
export function buildPayload(row: DemandRow, loraFile: string) {
  const wf = JSON.parse(JSON.stringify(WORKFLOW_TEMPLATE));
  (wf["3"].inputs as Record<string, unknown>).text = row.prompt;       // ③ 正向提示词
  (wf["4"].inputs as Record<string, unknown>).text = row.negative;     // ④ 反向提示词
  (wf["5"].inputs as Record<string, unknown>).batch_size = row.count;  // ⑤ 数量
  (wf["2"].inputs as Record<string, unknown>).lora_name = loraFile;    // ② 挂哪包 LoRA
  (wf["6"].inputs as Record<string, unknown>).seed = Math.floor(Math.random() * 1e15);
  return { prompt: wf };
}

/** 测试 ComfyUI 连接（GET /system_stats） */
export async function testConnection(endpoint: string): Promise<{ ok: boolean; msg: string }> {
  try {
    const res = await fetch(`${endpoint.replace(/\/$/, '')}/system_stats`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { ok: false, msg: `HTTP ${res.status}` };
    const data = await res.json();
    const vram = data?.devices?.[0]?.vram_total
      ? `显存 ${(data.devices[0].vram_total / 1024 ** 3).toFixed(1)} GB`
      : '';
    return { ok: true, msg: `连接成功 ${vram}` };
  } catch (e) {
    return { ok: false, msg: `连不上：${e instanceof Error ? e.message : String(e)}（ComfyUI 启动了吗？地址对吗？）` };
  }
}

/** 提交一条生图任务到 ComfyUI（POST /prompt） */
export async function submitToComfy(endpoint: string, row: DemandRow, loraFile: string): Promise<string> {
  const res = await fetch(`${endpoint.replace(/\/$/, '')}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildPayload(row, loraFile)),
  });
  if (!res.ok) throw new Error(`ComfyUI 返回 HTTP ${res.status}`);
  const data = await res.json();
  return data.prompt_id as string;
}
