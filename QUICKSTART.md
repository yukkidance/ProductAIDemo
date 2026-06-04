# 5 分钟快速启动

> 假设你已经拿到智谱 API Key (从 https://open.bigmodel.cn/ 免费申请 glm-4-flash)

> **想直接部署到 Render?** 跳到 [README.md](./README.md#option-arender推荐5-分钟上线) 5 分钟上线,无需本地环境。

## 零命令行启动(推荐)

**全程双击 `.bat` 即可,不需要在 PowerShell/cmd 里敲任何命令。**

### 1. 配置 API Key(30 秒)
```
找到 backend\.env.example  →  复制为 backend\.env
打开 backend\.env  →  把 ZHIPUAI_API_KEY=your_api_key_here 改成你的真实 key
```

### 2. 一键安装(2-3 分钟)
双击 **`init.bat`**,它会自动完成:
- 创建 `backend\.venv` 虚拟环境
- pip 安装后端依赖(用清华源加速)
- npm 安装前端依赖(用 npmmirror 加速)
- 生成 6 篇机务手册
- 灌入 SQLite 演示数据
- 训练 XGBoost 模型
- 构建 Chroma 向量库(首次下载 ~90MB)

### 3. 启动(10 秒)
双击 **`start.bat`**,会同时启动:
- 后端: <http://localhost:8000> (FastAPI + Swagger 文档)
- 前端: <http://localhost:3000> (浏览器自动打开)

## 验证清单

启动后浏览器:
- 主页能看到 4 个产品卡 + 底部可切换的 4 张架构图
- 进入智库机器人,点击示例问题 → 看到流式回答 + 引用源
- 进入营销生成,输入文案 → 看到带品牌风格的内容
- 进入生产分析,点击示例 → 看到自动 SQL + 表格
- 进入供应链预测,调滑块 → 看到预测曲线

## 常见问题

**Q: 端口 3000/8000 被占用**
A: 编辑 `backend\.env` 改 `BACKEND_PORT=8001`,编辑 `frontend\package.json` 把 `dev` 改成 `next dev -p 3001`,然后改 start.bat 里对应端口

**Q: 向量模型下载慢/失败**
A: 在 `init.bat` 的 pip install 之前手动设置:
```cmd
set HF_ENDPOINT=https://hf-mirror.com
```
或自己用迅雷/IDM 下载 BAAI/bge-small-zh-v1.5 到 `%USERPROFILE%\.cache\huggingface\hub\`

**Q: 智谱 API 报错 401**
A: 检查 `backend\.env` 中 key 是否复制完整(无空格、无换行、`sk-` 前缀正确)

**Q: 启动后报 CORS 错误**
A: 确认后端在 8000 端口且 `app/main.py` 中 `allow_origins` 包含 `http://localhost:3000`

**Q: 我非要在 PowerShell/cmd 里手动操作**
A: 用绝对路径调用 venv 内的 Python,不需要 activate:
```powershell
D:\AIProject\Demo0601\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

**Q: Mac/Linux 怎么办?**
A: 把 .bat 改成 .sh 即可,venv 路径换成 `backend/.venv/bin/python`,activate 改成 `source backend/.venv/bin/activate`

## bat 脚本编码说明

`init.bat` / `start.bat` 使用**纯英文 echo**,避免 Windows cmd 默认 GBK 代码页下 UTF-8 中文 echo 破坏命令行解析的兼容性问题。所有面向用户的中文文案都在 Markdown 文档里。
