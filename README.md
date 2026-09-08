# Jobbuy AIGC 自动化图文生成平台

复刻优设网《[如何搭建日产20000张图的AIGC工具？完整流程来了！](https://www.uisdc.com/aigc-generation-tool)》的完整链路，面向海外电商 Jobbuy 场景的 AIGC 批量生图平台。

## 平台模块（与文章一一对应）

| 模块 | 对应文章内容 |
|---|---|
| 📊 数据看板 | SOP 第 2 步：指标体系（日产量 / 良率 / 多样性 / 稳定性） |
| 🖼️ 批量生图 | 「prompt 需求表」：命名 / 正向词 / 反向词 / LoRA 风格 / 数量，支持 CSV 导入 |
| ⏳ 任务队列 | 批量任务排队执行（模拟服务器 7×24 出图） |
| ✅ 素材审核 | 三级分流：直接入库 / 需修图 / 废弃（废弃原因反哺优化） |
| 🗂️ 素材库 | SOP 第 4 步：按 SKU / 场景 / 命名归档检索 |
| 🧬 LoRA 模型库 | 场景拆解法：类目 → 点消排名 → 特征拆解 → 场景归类 → 炼 LoRA |
| ✍️ 文案工坊 | 文本生成线：SKU ID → LLM → 引流标题 / 详情文案 |
| ⚙️ 设置 | 工程文件（ComfyUI 工作流）+ SD API 对接配置 |

## 快速开始

```bash
npm install
npm run dev        # 默认 http://localhost:3000
```

**演示模式**（默认）：无需 GPU，本地 Canvas 生成占位场景图，完整走通"填表 → 排队 → 出图 → 审核 → 入库"全流程。

**ComfyUI 模式**（真实出图）：

1. 准备一台带 NVIDIA 显卡的机器，安装 [ComfyUI](https://github.com/comfyanonymous/ComfyUI)
2. 把 `comfyui/jobbuy_电商主图_ComfyUI工作流_中文版.json` 拖进 ComfyUI 画布验证出图
3. 以 CORS 模式启动：`python main.py --enable-cors-header '*'`（`--listen 0.0.0.0` 如需远程）
4. 在平台「设置」页切换到 ComfyUI 模式，填入地址（默认 `http://127.0.0.1:8188`），点"测试连接"

## 核心原理

工程文件（ComfyUI 工作流 JSON）把大模型、采样参数全部写死，只留四个"活口"：

```
② LoRA 风格包  ③ 正向提示词  ④ 反向提示词  ⑤ 生成数量
```

平台提交任务时，按需求表每一行替换这四个口，POST 到 ComfyUI 的 `/prompt` 接口出图——见 `src/lib/comfyui.ts`。

## 技术栈

React 19 · TypeScript · Vite · Tailwind CSS · shadcn/ui · react-router · localStorage 持久化

## 目录结构

```
src/
├── lib/
│   ├── store.tsx      # 全局数据层（任务队列模拟 + localStorage）
│   ├── demo.ts        # 演示出图引擎 + 文案规则引擎
│   └── comfyui.ts     # ComfyUI API 适配器（工程文件模板）
├── sections/          # 八大模块页面
└── types/             # TypeScript 类型定义
comfyui/               # 可直接拖入 ComfyUI 的工作流文件
```
