// 批量生图：对应文章的「prompt 需求表 / CSV」——每行 = 一条生图任务
// 五列对应：图像命名 / 图像内容(正向) / 不希望出现(反向) / 模型风格(LoRA) / 预生成数量
import { useState } from 'react';
import { useStore } from '@/lib/store';
import type { DemandRow } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const emptyRow = (loraId: string): DemandRow => ({ name: '', prompt: '', negative: '低质量、模糊、水印、文字、变形、多余元素', loraId, count: 4 });

export default function BatchGenerate() {
  const { loras, skus, submitBatch, settings } = useStore();
  const [skuId, setSkuId] = useState(skus[0]?.id ?? '');
  const [rows, setRows] = useState<DemandRow[]>([emptyRow(loras[0].id)]);
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [msg, setMsg] = useState('');

  const setRow = (i: number, patch: Partial<DemandRow>) =>
    setRows(rs => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)));

  const total = rows.reduce((s, r) => s + (r.count || 0), 0);

  const submit = () => {
    const valid = rows.filter(r => r.name.trim() && r.prompt.trim());
    if (!valid.length) { setMsg('⚠️ 至少填一行：图像命名 + 图像内容不能为空'); return; }
    const names = new Set(valid.map(r => r.name.trim()));
    if (names.size !== valid.length) { setMsg('⚠️ 图像命名不可重复（它是 ID）'); return; }
    submitBatch(valid, skuId);
    setMsg(`✅ 已提交 ${valid.length} 条任务、共 ${total} 张图（${settings.mode === 'demo' ? '演示模式' : 'ComfyUI 模式'}），去「任务队列」看进度`);
    setRows([emptyRow(loras[0].id)]);
  };

  // CSV 导入：文章原文格式「命名,内容,不希望出现,风格,数量」
  const importCsv = () => {
    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed: DemandRow[] = [];
    for (const line of lines) {
      const parts = line.split(/[,，]/).map(s => s.trim());
      if (parts.length < 2) continue;
      const lora = loras.find(l => l.name.includes(parts[3] ?? '') || l.id === parts[3]) ?? loras[0];
      parsed.push({
        name: parts[0],
        prompt: parts[1],
        negative: parts[2] || '低质量、模糊、水印',
        loraId: lora.id,
        count: Math.min(Math.max(parseInt(parts[4]) || 4, 1), 8),
      });
    }
    if (parsed.length) { setRows(parsed); setCsvOpen(false); setMsg(`✅ 已导入 ${parsed.length} 行`); }
    else setMsg('⚠️ 没解析到有效行，格式：命名,内容,不希望出现,风格,数量');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">批量生图</h1>
        <p className="text-sm text-muted-foreground mt-1">
          这就是文章里「prompt 编写设计师」每天填的需求表。每行 = 一条生图任务，提交后进入队列自动批量出图。
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-base">需求表</CardTitle>
            <span className="text-sm text-muted-foreground">作用于 SKU：</span>
            <select className="border rounded-md px-2 py-1.5 text-sm bg-background" value={skuId} onChange={e => setSkuId(e.target.value)}>
              {skus.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.id} · {s.name}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-[1fr_2fr_1.5fr_170px_80px_36px] gap-2 text-xs font-medium text-muted-foreground px-1">
            <span>图像命名（不可重复）</span><span>图像内容（想要什么 · 正向提示词）</span>
            <span>不希望出现（反向提示词）</span><span>模型风格（LoRA）</span><span>数量</span><span />
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_2fr_1.5fr_170px_80px_36px] gap-2 items-start">
              <Input value={r.name} placeholder="如：ins风耳环_1" onChange={e => setRow(i, { name: e.target.value })} />
              <Textarea rows={2} value={r.prompt} placeholder="单个银耳环平铺在米色亚麻布上，柔光，俯视，电商白底感…" onChange={e => setRow(i, { prompt: e.target.value })} />
              <Textarea rows={2} value={r.negative} onChange={e => setRow(i, { negative: e.target.value })} />
              <select className="border rounded-md px-2 py-2 text-sm bg-background h-16" value={r.loraId} onChange={e => setRow(i, { loraId: e.target.value })}>
                {loras.map(l => <option key={l.id} value={l.id}>{l.emoji} {l.name} {l.version}</option>)}
              </select>
              <Input type="number" min={1} max={8} value={r.count} onChange={e => setRow(i, { count: Math.min(Math.max(parseInt(e.target.value) || 1, 1), 8) })} />
              <Button variant="ghost" size="icon" onClick={() => setRows(rs => rs.filter((_, k) => k !== i))} disabled={rows.length === 1}>✕</Button>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-2 flex-wrap">
            <Button variant="outline" onClick={() => setRows(rs => [...rs, emptyRow(loras[0].id)])}>＋ 添加行</Button>
            <Button variant="outline" onClick={() => setCsvOpen(v => !v)}>📋 粘贴 CSV 导入</Button>
            <Button onClick={submit}>🚀 提交生成（共 {total} 张）</Button>
            {msg && <span className="text-sm">{msg}</span>}
          </div>

          {csvOpen && (
            <div className="border rounded-lg p-3 bg-muted/40 space-y-2">
              <p className="text-xs text-muted-foreground">
                文章原文格式（逗号分隔，每行一条）：<code>图像命名,图像内容,不希望出现,模型风格,数量</code>
              </p>
              <Textarea rows={4} value={csvText} onChange={e => setCsvText(e.target.value)}
                placeholder={'科技感轿车_1,单个科技感轿车 蓝色系 立体呈现 Q版圆润 白色背景 3D渲染,复杂细节 低质量 水印,flex,4'} />
              <Button size="sm" onClick={importCsv}>解析导入</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 text-sm text-muted-foreground space-y-1">
          <p>💡 <b>背后发生的事</b>：提交后，每一行会被填进「工程文件」（ComfyUI 工作流）预留的三个口——③正向词 ④反向词 ⑤数量，再调 SD 的 API 逐张出图。</p>
          <p>当前模式：<b>{settings.mode === 'demo' ? '演示模式（本地 Canvas 生成占位图，无需 GPU）' : `ComfyUI 模式（${settings.comfyEndpoint}）`}</b>，可在「设置」里切换。</p>
        </CardContent>
      </Card>
    </div>
  );
}
