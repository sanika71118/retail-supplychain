from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class AnalyticsSummaryResponse(BaseModel):
    shape: List[int]
    summary: Dict[str, Dict[str, Any]]
    null_counts: Dict[str, int]


class RAGQueryRequest(BaseModel):
    query: str


class RAGQueryResponse(BaseModel):
    answer: str
    retrieved_context: Optional[str] = None
