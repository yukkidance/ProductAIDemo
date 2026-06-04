# AGENTS.md

紧凑的 agent 协作指南。每行只留"agent 不看就会踩坑"的高信号信息。

## 项目定位

面试演示用 AI 作品集。前端展示 + 后端可交互的 4 个 AI 产品(RAG 智库 / 营销生成 / NL2SQL 分析 / XGBoost 预测)。**目标是 demo 跑通 + 面试话术**,不是生产级。

## 一键命令

| 场景 | 命令 |
|---|---|
| 首次安装 + 数据 | 双击 `init.bat` (2-3 分钟) |
| 日常启动 | 双击 `start.bat` |
| 后端 API 文档 | 启动后 <http://localhost:8000/docs> |

`init.bat` 内部按顺序: Python 检测 → 创建 venv → pip 装后端 → npm 装前端 → 4 个数据脚本(手册/SQLite/XGBoost/向量库)。**断点重启会从断点继续**(靠 `if exist` 跳过已完成步骤)。

## 关键环境坑(必须知道)

1. **Python 优先级**:`init.bat` 优先 `py -3.12`,回退 `python`。用户环境有 3.14 + 3.12。**不要改回纯 `python`**,否则会装到老 torch。
2. **pip 走 pypi 官方源**(非清华源)。清华源镜像没同步 torch 2.5-2.8 的 wheel。
3. **bat 文件必须纯英文 echo**。Windows cmd 默认 GBK 代码页,UTF-8 中文 echo 会破坏后续命令行解析(`REM` 本身不会出错,真正问题是 echo 后的中文字节)。
4. **不依赖 `activate`**:所有 bat 用 venv 内的 `python.exe` 绝对路径,避开 PowerShell 默认阻止 `.ps1` 脚本的问题。
5. **`backend/.env` 不进 git**:复制 `.env.example` 改 key,需要先于启动。
6. **chromadb 0.5.3 缺依赖**:`overrides` / `pypika` / `tenacity` / `posthog` 是其可选依赖,`pip install chromadb` 不会自动装。`init.bat` 显式装 `chromadb==0.5.23` 把这些打包进来。
7. **huggingface.co 经常被墙**:`init.bat` 和 `backend/app/main.py` 顶部**都必须**设置 `HF_ENDPOINT=https://hf-mirror.com`,否则 BGE 模型加载卡死。`main.py` 顶部用 `os.environ.setdefault` 设置,确保启动时立即生效。
8. **tokenizers 版本冲突**:chromadb 要 `<=0.20.3`,sentence-transformers 要 `>=0.22.0`。`init.bat` 装 `tokenizers>=0.22.0,<=0.23.0` 优先保证 sentence-transformers 工作(只用 RAG,不用 chromadb 的 tokenizers)。
9. **RAG 首次请求会卡**:`rag_service._ensure_init()` 首次加载 BGE + Chroma 需 5-15s。**修复方案**:`main.py` 的 `lifespan` 钩子在 startup 时预加载,避免首次用户请求时阻塞。

## 目录速记

| 路径 | 用途 |
|---|---|
| `backend/app/core/llm_client.py` | 智谱 LLM 统一封装(改模型只改 .env) |
| `backend/app/services/*.py` | 4 个 AI 业务服务(rag/marketing/nl2sql/forecast) |
| `backend/app/api/*.py` | 4 个 API 路由(SSE 流式在 knowledge/marketing) |
| `backend/app/data/manuals/*.md` | RAG 检索的机务手册(6 篇) |
| `backend/app/data/chroma/` | Chroma 持久化向量库 |
| `backend/app/data/production.db` | SQLite 演示库(4 表,~1500 行) |
| `backend/app/data/forecast_model.pkl` | 预训练 XGBoost 模型 |
| `backend/app/data/query_logs.json` | NL2SQL 查询日志 |
| `frontend/app/products/<id>/page.tsx` | 4 个产品页 |
| `frontend/components/architecture/flows.ts` | **4 张 React Flow 架构图数据** |
| `frontend/components/architecture/ArchNode.tsx` | 自定义节点样式 |
| `frontend/components/architecture/ArchitectureOverview.tsx` | 主页 Tab 切换 |
| `frontend/components/chat/KnowledgeChat.tsx` | SSE 流式对话组件 |
| `frontend/components/demo/*.tsx` | 3 个产品演示组件 |
| `frontend/lib/products.ts` | 产品元数据(名称/痛点/指标/技术栈) |
| `frontend/lib/api.ts` | axios + sseStream 工具 |
| `scripts/seed_manuals.py` | 生成 6 篇手册 |
| `scripts/seed_production_db.py` | 灌入 SQLite |
| `scripts/train_forecast_model.py` | 训练 XGBoost(合成 2000 行) |
| `scripts/build_vector_db.py` | 构建 Chroma 索引(首次下载 90MB) |
| `INTERVIEW.md` | 面试演示话术(每页 2-3 分钟) |

## 修改某项时的位置

| 想改什么 | 改哪里 |
|---|---|
| 加 LLM 模型 | `backend/.env` 的 `ZHIPU_MODEL`(无需改代码) |
| 改产品文案/痛点/指标/技术栈 | `frontend/lib/products.ts` |
| 改主页 4 个产品卡 | `frontend/app/page.tsx` |
| 改/加 架构图节点和连线 | `frontend/components/architecture/flows.ts` 的 4 个 `*Flow()` 函数 |
| 改架构图节点样式 | `frontend/components/architecture/ArchNode.tsx` |
| 改 RAG 检索/Prompt | `backend/app/services/rag_service.py` |
| 改 NL2SQL Schema 或 Few-shot | `backend/app/services/nl2sql_service.py` 顶部 |
| 改品牌风格/模板 | `backend/app/services/marketing_service.py` 顶部 `BRAND_STYLES` / `TEMPLATES` |
| 改预测特征/评价策略 | `backend/app/services/forecast_service.py` + 重跑 `train_forecast_model.py` |
| 加/换手册文档 | 放 `backend/app/data/manuals/*.md` + 重跑 `build_vector_db.py` |
| 加数据库表/数据 | 改 `scripts/seed_production_db.py` 重跑(会删原 db) |
| 改端口 | `backend/.env` 改 `BACKEND_PORT` + `frontend/package.json` 改 `dev` 脚本加 `-p` |
| 改 CORS | `backend/app/main.py` 的 `allow_origins` |

## 重新生成数据(常见维护)

需要"重置"演示数据时,**直接删除 `backend/app/data/` 下产物**再跑 `init.bat`:
```powershell
Remove-Item backend\app\data\chroma,backend\app\data\production.db,backend\app\data\forecast_model.pkl -Recurse -Force
.\init.bat
```

## 调试技巧

- **后端报错**:打开 `start.bat` 启动的"AI-Backend"窗口,栈跟踪会直接打印
- **RAG 检索质量差**:看 `backend/app/data/manuals/*.md` 的二级标题切分粒度,改 `split_md` 切分函数
- **NL2SQL 总是拒绝**:检查生成的 SQL 是否被关键字白名单拦截,放宽 `nl2sql_service.py:_clean_sql`
- **前端 SSE 不流式**:浏览器开发者工具 Network → 看 `EventStream` 响应,不是普通 fetch
- **架构图节点错位**:用 `fitView` 居中,看 `flows.ts` 中 `position: {x, y}` 坐标

## 已知约束(没有,不要问)

- **没有自动化测试**:演示项目,验证靠手动跑 `start.bat` 看 4 个产品页
- **没有 lint/typecheck 脚本**:`frontend/package.json` 里有 `lint` 但未配置 ESLint,直接跑会报错
- **没有 CI/Docker**:本地双击 bat 启动是唯一支持方式
- **没有 i18n**:全中文 UI,英文字符串只在代码/CLI
- **`backend/app/data/` 不进 git**(见 `.gitignore`)

## 面试展示路径(15 分钟)

参见 `INTERVIEW.md`。速记顺序:主页架构总览(2min) → 智库问答流式 + 引用(3min) → 营销生成品牌约束(2min) → NL2SQL 自动 SQL + 日志(3min) → 预测滑块 + 曲线(2min) → 收尾(3min)。
