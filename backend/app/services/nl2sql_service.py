import json
import re
import aiosqlite
from app.core.config import settings
from app.core.llm_client import llm


SCHEMA_DESC = """
数据库表结构(机务生产管理系统演示库):

1. orders(订单表)
   - order_id, order_date, aircraft_model(机型), customer, amount(金额), status(状态)

2. production(产量表)
   - id, date, line(产线:A/B/C), aircraft_model, units(当日产量), hours(工时)

3. oee(OEE 综合设备效率)
   - id, date, line, availability, performance, quality, oee_value

4. workhours(工时统计)
   - id, date, line, team(班组), planned_hours, actual_hours, overtime_hours
"""


class NL2SQLService:
    """自然语言 -> SQL -> 结果"""

    def get_schema_info(self):
        return {"schema": SCHEMA_DESC.strip()}

    def _build_prompt(self, question: str) -> str:
        return f"""你是 SQL 专家,根据用户的中文问题生成 SQLite 标准 SQL。

【数据库 Schema】
{SCHEMA_DESC}

【规则】
- 仅使用 SELECT 语句
- 字段名用反引号
- 日期用 date('now', '-1 month') 等相对函数
- 限返回 50 行
- 末尾加 LIMIT 50

【Few-shot】
Q: 上月 OEE 最低的产线
SQL: SELECT line, AVG(oee_value) as avg_oee FROM oee WHERE date >= date('now', '-1 month') GROUP BY line ORDER BY avg_oee ASC LIMIT 50

Q: 各机型本月产量
SQL: SELECT aircraft_model, SUM(units) as total FROM production WHERE date >= date('now', 'start of month') GROUP BY aircraft_model LIMIT 50

Q: {question}
SQL:"""

    async def query(self, question: str) -> dict:
        try:
            prompt = self._build_prompt(question)
            sql = await llm.chat(
                [{"role": "user", "content": prompt}],
                temperature=0.1,
            )
            sql = self._clean_sql(sql)
            if not sql:
                return {"success": False, "error": "无法生成 SQL", "generated_sql": ""}
            async with aiosqlite.connect(settings.SQLITE_PATH) as db:
                db.row_factory = aiosqlite.Row
                cursor = await db.execute(sql)
                rows = await cursor.fetchall()
                cols = [d[0] for d in cursor.description] if cursor.description else []
                data = [dict(row) for row in rows]
            return {
                "success": True,
                "question": question,
                "generated_sql": sql,
                "columns": cols,
                "rows": data,
                "row_count": len(data),
            }
        except Exception as e:
            return {"success": False, "error": str(e), "question": question}

    def _clean_sql(self, raw: str) -> str:
        """提取并校验 SQL"""
        if not raw:
            return ""
        s = raw.strip()
        # 去掉 markdown 代码块
        s = re.sub(r"```sql\s*", "", s, flags=re.IGNORECASE)
        s = re.sub(r"```", "", s)
        # 去掉 LLM 常加的 "SQL:" 前缀
        s = re.sub(r"^\s*SQL\s*[:：]\s*", "", s, flags=re.IGNORECASE)
        # 只保留第一条语句
        s = s.split(";")[0].strip()
        if not re.match(r"^\s*SELECT", s, re.IGNORECASE):
            return ""
        # 防止危险
        if re.search(r"\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE)\b", s, re.IGNORECASE):
            return ""
        return s + ";"


nl2sql_service = NL2SQLService()
