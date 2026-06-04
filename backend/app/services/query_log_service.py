"""
查询日志 - 高频查询分析(in-memory,适配 Render free ephemeral 磁盘)
- 不写文件,容器重启会清空(日志是 demo 数据,可接受)
"""
from collections import Counter
from datetime import datetime


class QueryLogService:
    """查询日志 - 内存版,每次启动重新计数"""

    def __init__(self):
        self._logs: list[dict] = []

    def log(self, question: str, sql: str):
        self._logs.append({
            "question": question,
            "sql": sql,
            "timestamp": datetime.now().isoformat(),
        })
        self._logs = self._logs[-200:]

    def summary(self):
        logs = self._logs
        counter = Counter()
        for l in logs:
            key = l["question"][:10]
            counter[key] += 1
        top = [
            {
                "pattern": k,
                "count": v,
                "sample": next((x["question"] for x in logs if x["question"].startswith(k)), ""),
            }
            for k, v in counter.most_common(5)
        ]
        return {
            "total_queries": len(logs),
            "top_queries": top,
            "report_suggestion": (
                f"建议将前 {len(top)} 个高频查询固化为报表"
                if len(logs) > 10
                else "日志样本不足,继续累积"
            ),
        }


query_log_service = QueryLogService()
