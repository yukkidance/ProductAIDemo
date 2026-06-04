# AI Engineering Portfolio

> 围绕机务维修 / 营销 / 生产 / 供应链四大真实业务场景的端到端 AI 工程作品集

![tech](https://img.shields.io/badge/Next.js-14-black) ![tech](https://img.shields.io/badge/FastAPI-0.111-009688) ![tech](https://img.shields.io/badge/XGBoost-2.0-orange) ![tech](https://img.shields.io/badge/RAG-智谱%20embedding--2-blue) ![tech](https://img.shields.io/badge/LLM-GLM--4--Flash-pink) ![deploy](https://img.shields.io/badge/deploy-Render-46e3b7)

## 4 大 AI 产品

| # | 产品 | 核心技术 | 演示 |
|---|---|---|---|
| 1 | **AI 智库机器人** | RAG + 意图分类 + Prompt 工程 | 流式对话 + 引用溯源 |
| 2 | **AI 营销内容生成器** | 品牌风格约束 + 多模板 | 文案生成 + 采纳反馈 |
| 3 | **AI 生产分析助手** | NL2SQL + Few-shot | 自然语言问数 + SQL 回显 |
| 4 | **AI 供应链需求预测** | XGBoost + 特征工程 | 滑块调参 + 预测曲线 |

## 部署

### Option A:Render(推荐,5 分钟上线)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. 把本仓库 fork 到你的 GitHub
2. Render Dashboard → New → Blueprint → 选仓库
3. 填 `ZHIPUAI_API_KEY`(必填,从 [open.bigmodel.cn](https://open.bigmodel.cn/) 免费申请)
4. 等 build 完成(~3-5 分钟,首启调智谱 embedding API 构建向量库)
5. 访问 Render 给的 frontend URL 即可

详细配置见 [`render.yaml`](./render.yaml)。

#### 🔐 部署后必做 1 件事:改默认密码

仓库代码里有一个 32 位随机串作为**默认密码**(在 `backend/app/core/config.py:18`),**这个值会进 GitHub 公开仓库**,所以**生产部署后必须立即在 Render Dashboard 覆盖**。

操作步骤:
1. 部署成功后,打开 backend 的 Render URL,浏览器会弹 Basic Auth 窗
2. 先用默认值 `demo` / `7aeae2CdqwnuMgh3MevbBmkZ8HN2zUeV` 登录(确认部署 OK)
3. 去 **Render Dashboard → ai-portfolio-backend → Environment**
4. 改 `DEMO_PASSWORD` 为 20+ 位强密码(用 `openssl rand -base64 18` 生成)
5. **Save Changes → Manual Deploy**(自动重启)
6. 重启后**只有**知道新密码的人能访问

> **为什么需要鉴权**:Render 公开 URL 任何人点开就能用,会刷你的智谱 API 余额。HTTP Basic Auth 是最简方案:HTTPS 加密传输,浏览器原生弹窗,前端 0 改动,后端中间件校验。
>
> **/.env.example 是占位符 / config.py 默认值是 32 位随机串(已暴露,生产必须改)**

### Option B:本地 Docker 启动

需要 Docker Desktop,镜像总大小 ~300MB。

```bash
# 后端
cd backend
docker build -t ai-portfolio-backend -f Dockerfile .

# 前端
cd ../frontend
docker build -t ai-portfolio-frontend -f Dockerfile .

# 运行(用同一 network 通信)
docker network create ai-portfolio
docker run -d --name backend -p 8000:8000 \
  --network ai-portfolio \
  -e ZHIPUAI_API_KEY=your_key \
  ai-portfolio-backend

docker run -d --name frontend -p 3000:3000 \
  --network ai-portfolio \
  -e NEXT_PUBLIC_API_BASE=http://backend:8000 \
  ai-portfolio-frontend

# 访问 http://localhost:3000
```

### Option C:本地开发(无 Docker)

- **Windows**:双击 `init.bat` → 双击 `start.bat`
- **Mac/Linux**:`./init.sh` → `./start.sh`

详见 [`QUICKSTART.md`](./QUICKSTART.md)。

## 项目结构

```
Demo0601/
├── frontend/                    # Next.js 14 + TypeScript + Tailwind
│   ├── Dockerfile              # 多阶段构建
│   └── app/components/lib/...   # 4 个产品页 + 架构图
├── backend/                     # FastAPI + httpx + XGBoost
│   ├── Dockerfile              # 轻量化(目标 < 200MB)
│   ├── requirements.txt        # 仅 11 个依赖,无 torch/transformers
│   └── app/
│       ├── core/               # config + llm_client(httpx 直调智谱)
│       ├── services/           # rag/marketing/nl2sql/forecast + embedding_client
│       └── api/                # 4 个 FastAPI 路由
├── scripts/                     # 数据准备(可重复执行)
│   ├── seed_manuals.py
│   ├── seed_production_db.py
│   ├── train_forecast_model.py
│   └── build_vector_db.py      # 调智谱 embedding-2 API,写 npy+json
├── render.yaml                  # Render Blueprint 一键部署
├── init.bat / init.sh          # 本地一键安装
├── start.bat / start.sh        # 本地一键启动
├── AGENTS.md                    # 协作指南(环境坑)
├── INTERVIEW.md                 # 面试话术
├── QUICKSTART.md                # 5 分钟快速启动
├── LICENSE                      # MIT
└── README.md                    # 本文件
```

## 轻量化(本项目要点)

从原始 2GB venv 瘦到 ~150MB,核心改动:

| 改造 | 节省 | 原因 |
|---|---|---|
| 删 torch / transformers / sentence-transformers | **1.2GB** | Embedding 改用智谱 API,无需本地模型 |
| 删 chromadb + chroma-hnswlib + onnxruntime | ~50MB | 30 个 chunk 用内存 numpy cosine,无 HNSW |
| 删 pandas / scipy / scikit-learn | 220MB | Forecast 用 numpy 手写 one-hot,XGBoost JSON 替代 pkl |
| openai SDK → httpx 直调 | 1.3MB + 启动快 | 智谱 OpenAI 兼容协议,httpx 60 行实现 |
| uvicorn[standard] → uvicorn | 0.2MB | 生产不需 reload/watchfiles |

**预期镜像**:backend ~150MB / frontend ~120MB,Render free(0.5GB 磁盘)可跑。

## API 端点

| Method | Path | 用途 |
|---|---|---|
| POST | `/api/knowledge/chat` | 智库机器人对话(SSE 流式) |
| POST | `/api/marketing/generate` | 营销文案生成(SSE 流式) |
| POST | `/api/analytics/query` | NL2SQL 自然语言查询 |
| GET  | `/api/analytics/logs` | 查询日志聚合(内存,重启清空) |
| GET  | `/api/analytics/schema` | 数据库结构 |
| POST | `/api/forecast/predict` | XGBoost 需求预测 |
| GET  | `/health` | 健康检查(详细字段) |

完整 OpenAPI 文档:启动后访问 `/docs`

## 技术亮点(面试可讲)

- **架构**:前后端分离 + SSE 流式输出 + React Flow 可视化架构
- **AI 工程**:RAG 检索增强、Prompt 模板化、Few-shot 学习、NL2SQL AST 校验
- **ML 工程**:XGBoost 训练-序列化-推理闭环、特征重要性可视化、分场景评价
- **轻量化**:Render free 可跑(200MB 镜像),无 torch/transformers,embedding API 化
- **部署**:Render Blueprint 一键,Docker 多阶段构建,镜像 < 300MB
- **工程化**:一键启动脚本、合成数据脚本幂等可重跑、配置与代码分离

## License

MIT
