// 一键生成：完全复刻文章工具的核心形态——
// 「input 参数作为预制节点，平台使用过程中只需要输入 sku list 列表，即可完成图像生成，直接上线」
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { composeAdImage, demoImage, generateCopy } from '@/lib/demo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// 类目 → 默认场景 LoRA（文章「场景拆解」的落地：按类目匹配场景包）
const CATEGORY_LORA: Record<string, string> = {
  '3C数码': 'flex', '家用电器': 'living', '家居日用': 'living', '美妆配饰': 'studio', '食品酒饮': 'outdoor',
};

const TARGETS = [
  { id: 'bg', label: '商品背景图', desc: '1 品多图：一个 SKU 出 N 张多样性场景图' },
  { id: 'ad', label: '电商首焦图', desc: '背景图 + 主标题/副标题/立即抢购 自动排版' },
  { id: 'xhs', label: '内容种草图', desc: '小红书式内容图模板' },
] as const;

export default function QuickGenerate() {
  const { skus, loras, tasks, submitBatch } = useStore();
  const [selected, setSelected] = useState<string[]>(skus.map(s => s.id));
  const [targets, setTargets] = useState<string[]>(['bg', 'ad']);
  const [runStart, setRunStart] = useState(0);
  const [composited, setComposited] = useState<Record<string, string>>({});

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);

  const loraOf = (id: string) => loras.find(l => l.id === id) ?? loras[0];

  // 本次运行产生的任务（按提交时间圈定）
  const runTasks = useMemo(() => tasks.filter(t => t.createdAt >= runStart && runStart > 0), [tasks, runStart]);
  const doneCount = runTasks.filter(t => t.status === 'done').length;
  const running = runStart > 0 && doneCount < runTasks.length;

  // 任务完成后，为「首焦图/内容图」目标合成排版成品
  useEffect(() => {
    runTasks.filter(t => t.status === 'done' && !t.row.name.endsWith('_bg')).forEach(t => {
      const sku = skus.find(s => s.id === t.row.sku);
      if (!sku) return;
      const copy = generateCopy(sku.name, sku.sellingPoints);
      t.seeds.slice(0, 2).forEach((seed, k) => {
        const key = `${t.id}-${k}`;
        if (composited[key]) return;
        composeAdImage(seed, loraOf(t.row.loraId), sku.emoji, {
          title: copy.titles[0].slice(0, 8),
          subtitle: sku.sellingPoints.slice(0, 2).join(' · '),
          cta: '立即抢购',
          template: k % 2 === 0 ? 'left' : 'right',
          textColor: '#1a1a1a',
          ctaColor: '#1a1a1a',
        }).then(url => setComposited(c => ({ ...c, [key]: url })));
      });
    });
  }, [runTasks, skus]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = () => {
    if (!selected.length || !targets.length) return;
    const rows = selected.flatMap(skuId => {
      const sku = skus.find(s => s.id === skuId)!;
      const loraId = CATEGORY_LORA[sku.category] ?? 'flex';
      return targets.map(tg => ({
        sku: skuId,
        name: `${skuId}_${tg}`,
        prompt: `${sku.name}，${sku.sellingPoints.join('，')}，电商产品摄影，场景图，高质量，商业摄影`,
        negative: '低质量、模糊、水印、文字、变形、多余元素、糟糕的手',
        loraId,
        count: tg === 'bg' ? 4 : 2,
      }));
    });
    setComposited({});
    setRunStart(Date.now());
    submitBatch(rows);
  };

  const bgTasks = runTasks.filter(t => t.row.name.endsWith('_bg') && t.status === 'done');
  const adTasks = runTasks.filter(t => !t.row.name.endsWith('_bg') && t.status === 'done');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">一键生成</h1>
        <p className="text-sm text-muted-foreground mt-1">
          文章原话：「input 参数作为预制节点，在应用平台的过程中<b>只需要输入 sku list 列表，即可完成图像生成，直接上线</b>」。所有规则、模型、prompt 已预置，运营只需勾选 SKU。
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">① 输入 SKU List</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {skus.map(s => (
              <label key={s.id} className={`flex items-center gap-3 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${selected.includes(s.id) ? 'border-indigo-500 bg-indigo-50/50' : 'hover:bg-muted/50'}`}>
                <input type="checkbox" className="accent-indigo-600" checked={selected.includes(s.id)} onChange={() => toggle(selected, setSelected, s.id)} />
                <span className="text-xl">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{s.id} · {s.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.category} · {s.price} · ★{s.rating} · {s.comments} 条评论 · 卖点：{s.sellingPoints.join('/')}</div>
                </div>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">商品图、标题、价格、评论全部跟随 SKU ID 自动带入（文章的链路输入：商品图 / 商品信息 / 商品评论 / 开箱图）</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">② 选择输出类型（文章的「图像输出规则」）</CardTitle></CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          {TARGETS.map(t => (
            <button key={t.id} onClick={() => toggle(targets, setTargets, t.id)}
              className={`border rounded-lg px-4 py-2.5 text-left transition-colors ${targets.includes(t.id) ? 'border-indigo-500 bg-indigo-50/50' : 'hover:bg-muted/50'}`}>
              <div className="text-sm font-medium">{t.label}</div>
              <div className="text-xs text-muted-foreground">{t.desc}</div>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button size="lg" onClick={run} disabled={!selected.length || !targets.length || running}>
          🚀 一键批量生成（{selected.length} 个 SKU × {targets.length} 类输出）
        </Button>
        {running && <span className="text-sm text-muted-foreground">批量生产中 {doneCount}/{runTasks.length}…</span>}
        {runStart > 0 && !running && <Badge className="bg-emerald-600">✅ 全部完成，已送「素材审核」</Badge>}
      </div>
      {running && <Progress value={runTasks.length ? (doneCount / runTasks.length) * 100 : 0} className="h-2" />}

      {/* 输出：背景图（1品多图） */}
      {bgTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">📸 商品背景图 · 1品多图</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {bgTasks.flatMap(t => {
              const sku = skus.find(s => s.id === t.row.sku)!;
              return t.seeds.map((seed, k) => (
                <div key={`${t.id}-${k}`} className="space-y-1">
                  <img src={demoImage(seed, loraOf(t.row.loraId), sku.emoji)} className="w-full aspect-square object-cover rounded-lg border" alt={t.row.name} />
                  <div className="text-xs text-muted-foreground truncate">{t.row.name}_{k + 1} · {loraOf(t.row.loraId).name}</div>
                </div>
              ));
            })}
          </CardContent>
        </Card>
      )}

      {/* 输出：首焦/内容图（自动图文布局成品） */}
      {adTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">🪧 首焦 / 内容图 · 自动图文布局成品</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adTasks.flatMap(t =>
              t.seeds.slice(0, 2).map((_, k) => {
                const url = composited[`${t.id}-${k}`];
                return url ? (
                  <div key={`${t.id}-${k}`} className="space-y-1">
                    <img src={url} className="w-full rounded-lg border" alt={t.row.name} />
                    <div className="text-xs text-muted-foreground">{t.row.name} · 版式{k + 1} · 已自动叠加主标题/副标题/点击引导</div>
                  </div>
                ) : (
                  <div key={`${t.id}-${k}`} className="aspect-square rounded-lg border bg-muted/40 animate-pulse" />
                );
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
