// LoRA 模型库：对应文章「Lora模型训练 · 电商多场景应用」+「场景拆解」
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function LoraModels() {
  const { loras } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">LoRA 模型库</h1>
        <p className="text-sm text-muted-foreground mt-1">
          文章做法：按平台类目 + 点消排名找高价值商品 → 拆解背景图特征（雨林/严寒/桌面…）→ 归类成场景 → 每个场景炼一个 LoRA。调优看三个指标：良率、多样性、稳定性。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loras.map(l => (
          <Card key={l.id} className="overflow-hidden">
            <div className="h-24 flex items-center justify-center text-4xl" style={{ background: `linear-gradient(135deg, ${l.palette[0]}, ${l.palette[1]})` }}>
              {l.emoji}
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{l.name} <span className="text-muted-foreground font-normal">{l.version}</span></CardTitle>
                <Badge className={l.status === 'online' ? 'bg-emerald-600' : 'bg-amber-500'}>{l.status === 'online' ? '已上线' : '训练中'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>场景分类</span><span className="text-foreground">{l.scene}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>训练素材</span><span className="text-foreground">{l.trainedImages} 张</span></div>
              <div className="flex justify-between text-muted-foreground"><span>默认权重</span><span className="text-foreground">{l.strength}</span></div>
              <div>
                <div className="flex justify-between text-muted-foreground mb-1"><span>良率</span><span className="text-foreground">{l.yieldRate}%</span></div>
                <Progress value={l.yieldRate} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">怎么炼一个新 LoRA？（文章「场景拆解」法 + Kohya 流程）</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1.5">
          <p>1️⃣ <b>定场景</b>：拉类目点消排名 → 找高价值 SKU → 拆解它们的背景特征 → 归类出要补的场景（如"浴室场景"）</p>
          <p>2️⃣ <b>备素材</b>：收集该场景 20~30 张高质量参考图，统一裁切到 1024×1024</p>
          <p>3️⃣ <b>打标</b>：用 WD14/BLIP 自动打标后人工修正，加统一触发词</p>
          <p>4️⃣ <b>训练</b>：Kohya_ss，学习率 1e-4，10 个 Epoch，每 2 轮存一次</p>
          <p>5️⃣ <b>验收调优</b>：权重 0.6~0.8 试出图，盯三个指标——良率 / 多样性 / 稳定性，不达标就回去调素材或参数</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">文章公布的训练参数（Kohya，照抄即可）</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b"><th className="py-2">类型</th><th>参数</th><th>值</th></tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b"><td className="py-2 font-medium" rowSpan={2}>变量（按素材量）</td><td className="py-2">30–100 张</td><td className="font-mono text-xs">repeat=60 · network_dim=64 · network_alpha=32</td></tr>
              <tr className="border-b"><td className="py-2">101–500 张</td><td className="font-mono text-xs">repeat=80 · network_dim=128 · network_alpha=64</td></tr>
              <tr className="border-b"><td className="py-2 font-medium">定量（别动）</td><td colSpan={2} className="font-mono text-xs">batch_size=1 · unet_lr=1e-4 · text_encoder_lr=1e-5</td></tr>
              <tr><td className="py-2 font-medium">loss 合格线</td><td colSpan={2}>0.07–0.08（epoch 跑 1–2 轮 loss 降不下来就调变量重训）</td></tr>
            </tbody>
          </table>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[['拟合度测试', '训练集特征是否学到'], ['泛化性测试', '换产品/场景是否跑偏'], ['自动化批量测试', '500+ 张/list 压测稳定性']].map(([t, d]) => (
              <div key={t} className="border rounded-lg p-3">
                <div className="text-sm font-medium">{t}</div>
                <div className="text-xs text-muted-foreground mt-1">{d}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">文章原话：三个维度在哪个流程节点就已存在对结果影响，一个维度测试不达标，可精准找到需要优化的节点。</p>
        </CardContent>
      </Card>
    </div>
  );
}
