// 全局数据层：localStorage 持久化 + 任务队列模拟引擎
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Asset, CopyResult, DemandRow, GenTask, LoraModel, Settings, Sku } from '@/types';
import { hashSeed } from '@/lib/demo';

// ---------- 初始数据：LoRA 场景库（对应文章"场景拆解"：影棚/户外/客厅/厨房…） ----------
export const SEED_LORAS: LoraModel[] = [
  { id: 'studio',   name: 'STUDIO SCENE',  version: 'V1.0', scene: '渲染场景', palette: ['#dfe7f5', '#8fa8c8'], emoji: '💡', strength: 0.8, trainedImages: 32, yieldRate: 78, status: 'online' },
  { id: 'outdoor',  name: 'OUTDOOR SCENE', version: 'V1.0', scene: '户外场景', palette: ['#d5ecc2', '#5d9c59'], emoji: '🌿', strength: 0.8, trainedImages: 28, yieldRate: 71, status: 'online' },
  { id: 'living',   name: 'LIVING ROOM',   version: 'V1.0', scene: '桌面场景', palette: ['#f3e6d0', '#c8a575'], emoji: '🛋️', strength: 0.75, trainedImages: 30, yieldRate: 74, status: 'online' },
  { id: 'kitchen',  name: 'KITCHEN SCENE', version: 'V1.0', scene: '地面场景', palette: ['#f6d9d5', '#cf8577'], emoji: '🍳', strength: 0.7, trainedImages: 24, yieldRate: 66, status: 'online' },
  { id: 'festival', name: 'FESTIVAL SALE', version: 'V2.0', scene: '特殊场景', palette: ['#ffe3c2', '#e8603c'], emoji: '🎉', strength: 0.85, trainedImages: 36, yieldRate: 69, status: 'online' },
  { id: 'flex',     name: 'STYLE FLEX',    version: 'V6.0', scene: '通用多场景', palette: ['#dceef7', '#4a8fc9'], emoji: '🌐', strength: 0.8, trainedImages: 60, yieldRate: 81, status: 'online' },
];

// ---------- 初始数据：SKU 商品库（对应文章输入：SKU ID 携带商品图/信息/评论） ----------
export const SEED_SKUS: Sku[] = [
  { id: 'JB-1001', name: '银色极简耳环', category: '美妆配饰', sellingPoints: ['925银防过敏', 'ins风百搭', '轻奢质感'], emoji: '💍', price: '$12.99', rating: 4.8, comments: 2304 },
  { id: 'JB-1002', name: '智能运动手表', category: '3C数码', sellingPoints: ['心率血氧监测', '14天长续航', '50米防水'], emoji: '⌚', price: '$49.99', rating: 4.6, comments: 8921 },
  { id: 'JB-1003', name: '马卡龙收纳盒', category: '家居日用', sellingPoints: ['可叠放设计', '食品级材质', '北欧配色'], emoji: '📦', price: '$18.50', rating: 4.7, comments: 1567 },
  { id: 'JB-1004', name: '青梅果酒礼盒', category: '食品酒饮', sellingPoints: ['微醺低度', '高颜值礼盒', '佐餐百搭'], emoji: '🍶', price: '$25.00', rating: 4.9, comments: 3102 },
  { id: 'JB-1005', name: '立式变频空调', category: '家用电器', sellingPoints: ['智柔变频', '节能省电', '温湿双控'], emoji: '🌬️', price: '$699.00', rating: 4.7, comments: 678 },
];

const DEFAULT_SETTINGS: Settings = { mode: 'demo', comfyEndpoint: 'http://127.0.0.1:8188' };

interface StoreState {
  loras: LoraModel[];
  skus: Sku[];
  tasks: GenTask[];
  assets: Asset[];
  copies: CopyResult[];
  settings: Settings;
  submitBatch: (rows: DemandRow[]) => void;  reviewAsset: (id: string, status: Asset['status'], reason?: string) => void;
  addCopy: (c: CopyResult) => void;
  setSettings: (s: Settings) => void;
  resetAll: () => void;
}

const StoreCtx = createContext<StoreState | null>(null);
const LS_KEY = 'jobbuy-aigc-v1';

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const saved = load();
  const [loras] = useState<LoraModel[]>(SEED_LORAS);
  const [skus] = useState<Sku[]>(SEED_SKUS);
  const [tasks, setTasks] = useState<GenTask[]>(saved?.tasks ?? []);
  const [assets, setAssets] = useState<Asset[]>(saved?.assets ?? []);
  const [copies, setCopies] = useState<CopyResult[]>(saved?.copies ?? []);
  const [settings, setSettings] = useState<Settings>(saved?.settings ?? DEFAULT_SETTINGS);
  const timers = useRef<number[]>([]);

  // 持久化（图片 dataURL 不落盘，按 seed 确定性重生成）
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ tasks, assets, copies, settings }));
  }, [tasks, assets, copies, settings]);

  // 提交一批需求 → 建立任务 → 模拟"服务器 7×24 出图"的进度
  const submitBatch = (rows: DemandRow[]) => {
    const now = Date.now();
    const newTasks: GenTask[] = rows.map((row, i) => ({
      id: `T${now}-${i}`,
      row,
      status: 'queued',
      progress: 0,
      createdAt: now,
      seeds: Array.from({ length: row.count }, (_, k) => hashSeed(`${row.name}-${k}`)),
    }));
    setTasks(t => [...newTasks, ...t]);

    newTasks.forEach((task, i) => {
      // 排队 stagger 启动
      const start = window.setTimeout(() => {
        setTasks(ts => ts.map(t => t.id === task.id ? { ...t, status: 'running' } : t));
        // 进度推进
        const iv = window.setInterval(() => {
          setTasks(ts => ts.map(t => {
            if (t.id !== task.id || t.status !== 'running') return t;
            const p = Math.min(100, t.progress + 8 + Math.random() * 14);
            return { ...t, progress: p };
          }));
        }, 400);
        timers.current.push(iv);
        // 完成 → 生成素材进入审核池
        const done = window.setTimeout(() => {
          window.clearInterval(iv);
          setTasks(ts => ts.map(t => t.id === task.id ? { ...t, status: 'done', progress: 100 } : t));
          setAssets(as => [
            ...task.seeds.map((seed, k) => ({
              id: `A${task.id}-${k}`,
              taskName: task.row.name,
              sku: task.row.sku,
              seed,
              loraId: task.row.loraId,
              prompt: task.row.prompt,
              status: 'pending' as const,
              createdAt: Date.now(),
            })),
            ...as,
          ]);
        }, 2600 + i * 900);
        timers.current.push(done);
      }, 500 + i * 1200);
      timers.current.push(start);
    });
  };

  const reviewAsset = (id: string, status: Asset['status'], reason?: string) =>
    setAssets(as => as.map(a => a.id === id ? { ...a, status, rejectReason: reason } : a));

  const addCopy = (c: CopyResult) => setCopies(cs => [c, ...cs].slice(0, 50));

  const resetAll = () => {
    timers.current.forEach(t => { window.clearTimeout(t); window.clearInterval(t); });
    setTasks([]); setAssets([]); setCopies([]);
    localStorage.removeItem(LS_KEY);
  };

  return (
    <StoreCtx.Provider value={{ loras, skus, tasks, assets, copies, settings, submitBatch, reviewAsset, addCopy, setSettings, resetAll }}>
      {children}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
