from fastapi import APIRouter
from pydantic import BaseModel
from app.services.nl2sql_service import nl2sql_service
from app.services.query_log_service import query_log_service

router = APIRouter()


class QueryRequest(BaseModel):
    question: str


@router.post("/query")
async def query(req: QueryRequest):
    """自然语言查询 -> SQL -> 结果"""
    result = await nl2sql_service.query(req.question)
    if result.get("success"):
        query_log_service.log(req.question, result.get("generated_sql", ""))
    return result


@router.get("/logs")
async def logs():
    """查询日志(高频查询分析)"""
    return query_log_service.summary()


@router.get("/schema")
async def schema():
    """数据库结构(给前端展示)"""
    return nl2sql_service.get_schema_info()
