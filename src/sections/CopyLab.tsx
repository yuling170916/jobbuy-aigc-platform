// 文案工坊：对应文章链路图的「文本生成线」——SKU ID → LLM → 引流标题/详情文案
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { generateCopy } from '@/lib/demo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CopyLab() {
  const { skus, copies, addCopy } = useStore();
  const [skuId, setSkuId] = useState(skus[0]?.id ?? '');

  const sku = skus.find(s => s.id === skuId) ?? skus[0];

  const run = () => {
    const r = generateCopy(sku.name, sku.sellingPoints);
    addCopy({ skuId: sku.id, titles: r.titles, detail: r.detail, createdAt: Date.now() });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">文案工坊</h1>
        <p className="text-sm text-muted-foreground mt-1">
          文章的文本生成线：输入 SKU ID，自动带出商品信息和卖点，按「选题/标题/风格/内容/关键词规则」生成引流标题和详情文案。（演示用规则模板，接入 LLM API 即真实生成）
        </p>
      </div>

      <Card>
        <CardContent className="pt-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground">选择 SKU：</span>
          <select className="border rounded-md px-2 py-1.5 text-sm bg-background" value={skuId} onChange={e => setSkuId(e.target.value)}>
            {skus.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.id} · {s.name}</option>)}
          </select>
          <span className="text-xs text-muted-foreground">卖点：{sku.sellingPoints.join(' / ')}</span>
          <Button onClick={run}>✍️ 生成文案</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {copies.map(c => {
          const s = skus.find(x => x.id === c.skuId);
          return (
            <Card key={c.createdAt}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{s?.emoji} {s?.name} <span className="text-xs text-muted-foreground font-normal">{new Date(c.createdAt).toLocaleString()}</span></CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">引流标题 ×5</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {c.titles.map((t, i) => <li key={i}>{t}</li>)}
                  </ol>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">详情文案</p>
                  <pre className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{c.detail}</pre>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
