// 素材审核：对应文章的「三级审核」——直接入库 / 需二次修图 / 废弃
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { demoImage } from '@/lib/demo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Review() {
  const { assets, loras, skus, reviewAsset } = useStore();
  const [reason, setReason] = useState<Record<string, string>>({});
  const pending = assets.filter(a => a.status === 'pending');
  const reviewed = assets.filter(a => a.status !== 'pending');

  const skuOf = (id: string) => skus.find(s => s.id === id) ?? skus[0];
  const loraOf = (id: string) => loras.find(l => l.id === id) ?? loras[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">素材审核</h1>
        <p className="text-sm text-muted-foreground mt-1">
          文章的三级分流：✅ 达到视觉标准直接入库 · 🔧 略微瑕疵修图后入库 · 🗑 严重异形无修改价值废弃。废弃原因会记录，反哺 prompt 和 LoRA 优化（SOP 第 5 步）。
        </p>
      </div>

      {pending.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">审核池是空的。任务完成后，图会自动进入这里。</CardContent></Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {pending.map(a => {
          const lora = loraOf(a.loraId); const sku = skuOf(a.sku);
          return (
            <Card key={a.id} className="overflow-hidden">
              <img src={demoImage(a.seed, lora, sku.emoji)} alt={a.taskName} className="w-full aspect-square object-cover" />
              <CardContent className="p-3 space-y-2">
                <div className="text-sm font-medium truncate">{a.taskName}</div>
                <div className="text-xs text-muted-foreground">{sku.id} · {lora.name}</div>
                <div className="flex gap-1.5">
                  <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => reviewAsset(a.id, 'approved')}>✅ 入库</Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => reviewAsset(a.id, 'fix')}>🔧 修图</Button>
                  <Button size="sm" variant="destructive" className="flex-1" onClick={() => reviewAsset(a.id, 'rejected', reason[a.id] || '画面不达标')}>🗑</Button>
                </div>
                <input
                  className="w-full text-xs border rounded px-2 py-1 bg-background"
                  placeholder="废弃原因（可选）：异形/风格跑偏…"
                  value={reason[a.id] ?? ''}
                  onChange={e => setReason(r => ({ ...r, [a.id]: e.target.value }))}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {reviewed.length > 0 && (
        <p className="text-sm text-muted-foreground">已审 {reviewed.length} 张：入库 {reviewed.filter(a => a.status === 'approved').length} · 需修图 {reviewed.filter(a => a.status === 'fix').length} · 废弃 {reviewed.filter(a => a.status === 'rejected').length}（入库素材见「素材库」）</p>
      )}
    </div>
  );
}
