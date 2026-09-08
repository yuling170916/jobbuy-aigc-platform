// Jobbuy AIGC 平台 · 数据类型定义
// 对应文章《如何搭建日产20000张图的AIGC工具》中的概念模型

/** LoRA 风格模型（文章中的"场景 LoRA"，如 STUDIO SCENE V1.0） */
export interface LoraModel {
  id: string;
  name: string;            // 如 STUDIO SCENE
  version: string;         // 如 V1.0
  scene: string;           // 场景分类：渲染场景/户外场景/桌面场景…
  palette: [string, string]; // 演示模式出图的渐变色
  emoji: string;           // 演示模式出图的场景符号
  strength: number;        // 默认权重 0-1
  trainedImages: number;   // 训练素材数量
  yieldRate: number;       // 良率（一次通过率 %）
  status: 'online' | 'training';
}

/** 需求表中的一行（对应文章的 CSV：命名,内容,不希望出现,风格,数量） */
export interface DemandRow {
  name: string;      // 图像命名（不可重复）
  prompt: string;    // 图像内容（正向提示词）
  negative: string;  // 不希望出现（反向提示词）
  loraId: string;    // 模型风格（选 LoRA）
  count: number;     // 预生成数量
}

/** 生图任务（提交需求表后进入任务队列） */
export interface GenTask {
  id: string;
  row: DemandRow;
  status: 'queued' | 'running' | 'done';
  progress: number;   // 0-100
  createdAt: number;
  seeds: number[];    // 每张图的种子（演示模式确定性出图）
}

/** 素材（任务完成后进入审核池） */
export interface Asset {
  id: string;
  taskName: string;
  sku: string;
  seed: number;
  loraId: string;
  prompt: string;
  status: 'pending' | 'approved' | 'fix' | 'rejected'; // 待审/入库/需修图/废弃
  rejectReason?: string;
  createdAt: number;
}

/** SKU 商品（文章链路图的输入：SKU ID 携带商品图/信息/评论） */
export interface Sku {
  id: string;
  name: string;
  category: string;
  sellingPoints: string[];
  emoji: string;
}

/** 文案任务产出（文本线：引流标题/详情文案） */
export interface CopyResult {
  skuId: string;
  titles: string[];
  detail: string;
  createdAt: number;
}

/** 平台设置（ComfyUI API 对接） */
export interface Settings {
  mode: 'demo' | 'comfyui';
  comfyEndpoint: string; // 如 http://127.0.0.1:8188
}
