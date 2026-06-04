import json
from typing import AsyncGenerator
from app.core.llm_client import llm


# 品牌风格约束 - 可扩展
BRAND_STYLES = {
    "default": {
        "tone": "亲和、专业、年轻化",
        "forbidden_words": ["最", "第一", "绝对", "100%", "神器", "秒杀"],
        "signature_phrases": ["让生活更轻盈", "用心选好物"],
        "emoji": "适度使用",
    },
    "premium": {
        "tone": "高端、克制、品质感",
        "forbidden_words": ["便宜", "白菜价", "血赚", "炸裂"],
        "signature_phrases": ["匠心", "精工", "本色"],
        "emoji": "极少使用",
    },
}

TEMPLATES = {
    "xiaohongshu": """# 小红书种草文案结构
- 标题:emoji+数字+痛点(20字内)
- 开头:身份代入/场景描述
- 中间:产品卖点 3 条(感官化表达)
- 结尾:互动话题+品牌植入
- 标签:5-8 个""",
    "wechat": """# 公众号推文结构
- 标题:观点+人群标签
- 开头:故事/数据/痛点切入
- 正文:小标题分段+案例
- 结尾:CTA 引导""",
    "douyin": """# 抖音脚本结构
- 0-3s:钩子(冲突/疑问)
- 4-15s:产品演示
- 16-30s:卖点放大
- 30-45s:转化引导""",
    "taobao": """# 详情页结构
- 首屏:核心卖点+信任背书
- 中段:痛点-解决方案
- 末段:FABE 法则+售后""",
}


class MarketingService:
    """营销内容生成 - 品牌风格约束 + 多模板"""

    def _build_prompt(self, requirement: str, template: str, brand: str) -> str:
        style = BRAND_STYLES.get(brand, BRAND_STYLES["default"])
        tmpl = TEMPLATES.get(template, TEMPLATES["xiaohongshu"])
        return f"""你是资深内容营销专家。

【品牌风格约束】
- 语气: {style['tone']}
- 禁用词: {', '.join(style['forbidden_words'])} (严禁出现)
- 标志性表达: 必须至少使用 1 个 ({', '.join(style['signature_phrases'])})
- emoji: {style['emoji']}

【内容模板】
{tmpl}

【用户需求】{requirement}

【输出要求】
1. 严格遵守禁用词约束
2. 自然融入标志性表达
3. 符合平台调性
4. 直接输出文案,无需解释"""

    async def generate_stream(
        self, requirement: str, template: str, brand: str
    ) -> AsyncGenerator[str, None]:
        prompt = self._build_prompt(requirement, template, brand)
        messages = [{"role": "user", "content": prompt}]
        async for chunk in llm.chat_stream(messages, temperature=0.8):
            yield chunk


marketing_service = MarketingService()
