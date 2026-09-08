// 图文布局：对应文章「02 图文布局生成」——版式构成规则：位置关系 / 文本规范 / 衬底元素规范 / 色彩规范
// 通过识别 Sku ID 携带的产品图、标题、价格、评论等信息，自动布局主标题、副标题、点击引导
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { composeAdImage, contrastRatio, generateCopy } from '@/lib/demo';
import type { AdSpec } from '@/lib/demo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const TEXT_COLORS = ['#1a1a1a', '#ffffff', '#8a4b1f', '#1f4d8a', '#3d6b35'];
const CTA_COLORS = ['#1a1a1a', '#e2231a', '#4a5cf0', '#0e7a52'];

export default function AdLayout() {
  const { skus, loras } = useStore();
  const [skuId, setSkuId] = useState(skus[0]?.id ?? '');
  const [loraId, setLoraId] = useState(loras[0].id);
  const [template, setTemplate] = useState<AdSpec['template']>('left');
  const sku = skus.find(s => s.id === skuId) ?? skus[0];
  const lora = loras.find(l => l.id === loraId) ?? loras[0];

  const autoCopy = useMemo(() => generateCopy(sku.name, sku.sellingPoints), [sku]);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [cta, setCta] = useState('立即抢购');
  const [textColor, setTextColor] = useState(TEXT_COLORS[0]);
  const [ctaColor, setCtaColor] = useState(CTA_COLORS[0]);
  const [url, setUrl] = useState('');

  // 切换 SKU 时自动带入文案（文章：识别 Sku ID 携带的信息自动布局）
  useEffect(() => {
    setTitle(autoCopy.titles[0].slice(0, 8));
    setSubtitle(sku.sellingPoints.slice(0, 2).join(' · '));
  }, [skuId]); // eslint-disable-line react-hooks/exhaustive-deps

  const spec: AdSpec = { title, subtitle, cta, template, textColor, ctaColor };
  useEffect(() => {
    composeAdImage(20240422, lora, sku.emoji, spec).then(setUrl);
  }, [skuId, loraId, template, title, subtitle, cta, textColor, textColor, ctaColor]); // eslint-disable-line react-hooks/exhaustive-deps

  // WCAG 2 对比度检查（文章配色规范：正文 >4.5:1，标题 >3:1）
  const bgEstimate = lora.palette[0];
  const titleRatio = contrastRatio(textColor, bgEstimate);
  const ctaRatio = contrastRatio('#ffffff', ctaColor);

  const download = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sku.id}_首焦图_${template}.png`;
    a.click();
  };

  const Rule = ({ ok, label, ratio, need }: { ok: boolean; label: string; ratio: number; need: string }) => (
    <span className={`text-xs px-2 py-1 rounded-full ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
      {label} {ratio.toFixed(1)}:1 {ok ? '✓' : `✗ 需 ${need}`}
    </span>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">图文布局生成</h1>
        <p className="text-sm text-muted-foreground mt-1">
          文章 02 部分：版式构成规则 = 位置关系 + 文本规范 + 衬底元素规范 + 色彩规范。SKU 的标题/卖点自动带入，实时预览，可直接下载上线图。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-4">
        {/* 预览 */}
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-base">成品预览（首焦图 800×800）</CardTitle>
            <Button size="sm" onClick={download} disabled={!url}>⬇ 下载 PNG</Button>
          </CardHeader>
          <CardContent>
            {url
              ? <img src={url} className="w-full rounded-lg border" alt="首焦图预览" />
              : <div className="aspect-square rounded-lg border bg-muted/40 animate-pulse" />}
            <div className="flex gap-2 mt-3 flex-wrap items-center">
              <span className="text-xs text-muted-foreground">WCAG 2 对比度检查：</span>
              <Rule ok={titleRatio >= 3} label="标题" ratio={titleRatio} need="≥3:1" />
              <Rule ok={titleRatio >= 4.5} label="正文级" ratio={titleRatio} need="≥4.5:1" />
              <Rule ok={ctaRatio >= 4.5} label="按钮文字" ratio={ctaRatio} need="≥4.5:1" />
            </div>
          </CardContent>
        </Card>

        {/* 规则配置 */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">位置关系（版式模板）</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              {([['left', '左文右图'], ['right', '右文左图'], ['top', '上文下图']] as const).map(([v, label]) => (
                <button key={v} onClick={() => setTemplate(v)}
                  className={`flex-1 border rounded-lg py-2.5 text-sm transition-colors ${template === v ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-muted/50'}`}>
                  {label}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">文本规范（随 SKU 自动带入，可改）</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              <select className="w-full border rounded-md px-2 py-1.5 text-sm bg-background" value={skuId} onChange={e => setSkuId(e.target.value)}>
                {skus.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.id} · {s.name} · {s.price}</option>)}
              </select>
              <select className="w-full border rounded-md px-2 py-1.5 text-sm bg-background" value={loraId} onChange={e => setLoraId(e.target.value)}>
                {loras.map(l => <option key={l.id} value={l.id}>{l.emoji} 背景场景：{l.name}</option>)}
              </select>
              <div><label className="text-xs text-muted-foreground">主标题（≤8字，自动两行拆分）</label><Input value={title} maxLength={8} onChange={e => setTitle(e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground">副标题（≤16字）</label><Input value={subtitle} maxLength={16} onChange={e => setSubtitle(e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground">点击引导按钮</label><Input value={cta} maxLength={6} onChange={e => setCta(e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">色彩规范（WCAG 2）</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              <div>
                <label className="text-xs text-muted-foreground">文字颜色</label>
                <div className="flex gap-2 mt-1">
                  {TEXT_COLORS.map(c => (
                    <button key={c} onClick={() => setTextColor(c)} className={`w-8 h-8 rounded-full border-2 ${textColor === c ? 'border-indigo-500 scale-110' : 'border-transparent'}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">按钮颜色</label>
                <div className="flex gap-2 mt-1">
                  {CTA_COLORS.map(c => (
                    <button key={c} onClick={() => setCtaColor(c)} className={`w-8 h-8 rounded-full border-2 ${ctaColor === c ? 'border-indigo-500 scale-110' : 'border-transparent'}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
