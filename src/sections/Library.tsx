// 素材库：对应文章「素材管理员」环节——按业务/类型/标签/命名分类，可查找可复用
import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { demoImage } from '@/lib/demo';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function Library() {
  const { assets, loras, skus } = useStore();
  const [q, setQ] = useState('');
  const [loraFilter, setLoraFilter] = useState('all');

  const stock = assets.filter(a => a.status === 'approved' || a.status === 'fix');
  const filtered = useMemo(() => stock.filter(a => {
    const lora = loras.find(l => l.id === a.loraId);
    const hit = !q || a.taskName.includes(q) || a.sku.includes(q) || a.prompt.includes(q) || (lora?.name ?? '').includes(q.toUpperCase());
    return hit && (loraFilter === 'all' || a.loraId === loraFilter);
  }), [stock, q, loraFilter, loras]);

  const skuOf = (id: string) => skus.find(s => s.id === id) ?? skus[0];
  const loraOf = (id: string) => loras.find(l => l.id === id) ?? loras[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">素材库</h1>
        <p className="text-sm text-muted-foreground mt-1">审核通过的图按 SKU / 场景 / 命名归档，全公司可搜索复用——文章的 SOP 第 4 步「数据管理机制」。</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Input className="max-w-xs" placeholder="搜索：命名 / SKU / 内容…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="border rounded-md px-2 py-1.5 text-sm bg-background" value={loraFilter} onChange={e => setLoraFilter(e.target.value)}>
          <option value="all">全部场景</option>
          {loras.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <span className="text-sm text-muted-foreground self-center">共 {filtered.length} 张</span>
      </div>

      {filtered.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">素材库还是空的，先在「素材审核」里通过几张图。</CardContent></Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {filtered.map(a => {
          const lora = loraOf(a.loraId); const sku = skuOf(a.sku);
          return (
            <Card key={a.id} className="overflow-hidden">
              <img src={demoImage(a.seed, lora, sku.emoji)} alt={a.taskName} className="w-full aspect-square object-cover" />
              <CardContent className="p-2.5 space-y-1.5">
                <div className="text-xs font-medium truncate">{a.taskName}</div>
                <div className="flex gap-1 flex-wrap">
                  <Badge variant="secondary" className="text-[10px]">{a.sku}</Badge>
                  <Badge variant="outline" className="text-[10px]">{lora.name}</Badge>
                  {a.status === 'fix' && <Badge className="text-[10px] bg-amber-500">待修图</Badge>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
