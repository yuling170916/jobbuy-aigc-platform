// 场景拆解：完全复刻文章的「场景拆解」方法——
// 通过平台一级/三级类目 + 商品点消排名两个维度分析归类 SKU 背景，确认场景范围
const ROWS = [
  { cat: '3C数码', emoji: '📱', products: '耳机 / 手表 / 音箱', features: ['影棚', '渲染', '轮廓'], scene: '渲染场景', lora: 'STYLE FLEX V6.0' },
  { cat: '电脑办公', emoji: '💻', products: '笔记本 / 摄像头 / 升降桌', features: ['渲染', '侧', '严寒'], scene: '渲染场景', lora: 'STUDIO SCENE V1.0' },
  { cat: '家用电器', emoji: '🌬️', products: '空调 / 洗衣机 / 电饭煲', features: ['地-浴', '壁', '桌-厨'], scene: '地面场景', lora: 'KITCHEN SCENE V1.0' },
  { cat: '美妆护肤', emoji: '💄', products: '精华 / 耳环 / 香水', features: ['轮廓', '顶', '地-厅'], scene: '桌面场景', lora: 'STUDIO SCENE V1.0' },
  { cat: '食品酒饮', emoji: '🍶', products: '果酒 / 零食 / 冲调', features: ['桌-厨', '草坪', '雨林'], scene: '户外场景', lora: 'OUTDOOR SCENE V1.0' },
];

const SCENES = ['渲染场景', '户外场景', '地面场景', '桌面场景', '特殊场景'];

export default function SceneAnalysis() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">场景拆解</h1>
        <p className="text-sm text-muted-foreground mt-1">
          文章原话：「通过电商平台的一级类目、三级类目商品点消排名两个维度的对应 SKU 的背景进行分析、归类，确认场景范围。通过垂直场景进行稳定性、多样性自动化批量生产进行特征控制。」
        </p>
      </div>

      {/* 文章的四步方法 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['① 类目', '拉一级/三级类目清单'],
          ['② 点消排名', '按点击消耗找出高价值 SKU'],
          ['③ 特征拆解', '拆解这些 SKU 背景图的特征词（雨林/严寒/桌面…）'],
          ['④ 特征归类', '归为 5 大场景，每场景炼一个 LoRA'],
        ].map(([t, d]) => (
          <div key={t} className="border rounded-xl p-3.5 bg-card">
            <div className="font-semibold text-sm">{t}</div>
            <div className="text-xs text-muted-foreground mt-1">{d}</div>
          </div>
        ))}
      </div>

      {/* 文章的类目 → 特征 → 场景对照表 */}
      <div className="border rounded-xl overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-indigo-600 text-white text-left">
              <th className="px-4 py-2.5">类目</th>
              <th className="px-4 py-2.5">高价值商品（点消排名）</th>
              <th className="px-4 py-2.5">特征拆解</th>
              <th className="px-4 py-2.5">特征归类 → 场景</th>
              <th className="px-4 py-2.5">对应 LoRA</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(r => (
              <tr key={r.cat} className="border-t">
                <td className="px-4 py-2.5 font-medium">{r.emoji} {r.cat}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.products}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1.5 flex-wrap">
                    {r.features.map(f => <span key={f} className="text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2 py-0.5">{f}</span>)}
                  </div>
                </td>
                <td className="px-4 py-2.5"><span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">{r.scene}</span></td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{r.lora}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 五大场景 */}
      <div className="border rounded-xl p-4 bg-card">
        <div className="text-sm font-medium mb-2">文章的五大场景归类（场景多样性 120+ 由此扩展）</div>
        <div className="flex gap-2 flex-wrap">
          {SCENES.map(s => <span key={s} className="px-3 py-1.5 rounded-lg bg-slate-100 text-sm">{s}</span>)}
        </div>
      </div>

      {/* 数据标注规范（文章「数据标注」表格） */}
      <div className="border rounded-xl p-4 bg-card space-y-2">
        <div className="text-sm font-medium">配套：数据标注规范（炼 LoRA 前的打标格式，文章原文示例）</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 pr-3">触发词</th><th className="py-2 pr-3">商品名</th>
                <th className="py-2 pr-3">位置关系特征</th><th className="py-2 pr-3">环境特征（环境内容列举）</th><th className="py-2">其它</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-muted-foreground">
                <td className="py-2 pr-3 font-mono">触发词</td>
                <td className="py-2 pr-3 font-mono">1 electric oven,</td>
                <td className="py-2 pr-3 font-mono">sitting on brown log tabletop,</td>
                <td className="py-2 pr-3 font-mono">kitchen background, cutlery, kitchen utensils, flowers, cupboards,</td>
                <td className="py-2 font-mono">/</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">标注核心 = 对特征进行标注。文章还用 GPTs 搭了「图像标注导师」智能体辅助标注，效率 20+ 张/分钟。</p>
      </div>
    </div>
  );
}
