import pandas as pd
from typing import List, Tuple

import faiss
from sentence_transformers import SentenceTransformer

from openai import OpenAI

from .config import (
    SYNTHETIC_DIR,
    EMBEDDING_MODEL,
    OPENAI_API_KEY,
    LLM_MODEL,
)

# ======================================================
# RAG ENGINE
# ======================================================


class RAGEngine:
    def __init__(self):
        self.model = SentenceTransformer(EMBEDDING_MODEL)
        self.index = None
        self.chunks: List[str] = []
        self.metainfo: List[dict] = []
        self.client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

    # -------------------------------------------
    # DATA LOADING
    # -------------------------------------------
    def _load_data(self):
        inventory = pd.read_csv(SYNTHETIC_DIR / "inventory.csv")
        demand = pd.read_csv(SYNTHETIC_DIR / "demand_history.csv", parse_dates=["date"])
        suppliers = pd.read_csv(SYNTHETIC_DIR / "supplier.csv")
        shipments = pd.read_csv(
            SYNTHETIC_DIR / "shipments.csv",
            parse_dates=["date_shipped", "date_received"],
        )
        return inventory, demand, suppliers, shipments

    # -------------------------------------------
    # DOCUMENT CREATION (TEXT CHUNKS)
    # -------------------------------------------
    def _build_item_docs(self, inventory: pd.DataFrame, demand: pd.DataFrame) -> List[Tuple[str, dict]]:
        docs = []

        demand_agg = (
            demand.groupby("item_id")
            .agg(
                total_units_sold=("units_sold", "sum"),
                avg_daily_units=("units_sold", "mean"),
                total_shrinkage=("shrinkage", "sum"),
            )
            .reset_index()
        )

        inv = inventory.merge(demand_agg, on="item_id", how="left")

        for _, row in inv.iterrows():
            text = (
                f"ITEM REPORT:\n"
                f"Item ID: {int(row['item_id'])}\n"
                f"Name: {row['name']}\n"
                f"Category: {row['category']}\n"
                f"Current stock: {row['stock']}\n"
                f"Reorder point: {row['reorder_point']}\n"
                f"Unit cost: {row['unit_cost']}\n"
                f"Selling price: {row['selling_price']}\n"
                f"Total units sold: {row.get('total_units_sold', 0)}\n"
                f"Average daily units sold: {row.get('avg_daily_units', 0):.2f}\n"
                f"Total shrinkage events: {row.get('total_shrinkage', 0)}\n"
            )
            meta = {"type": "item", "item_id": int(row["item_id"])}
            docs.append((text, meta))

        return docs

    def _build_supplier_docs(
        self, suppliers: pd.DataFrame, shipments: pd.DataFrame
    ) -> List[Tuple[str, dict]]:
        docs = []

        # basic shipment stats per supplier
        ship_agg = (
            shipments.assign(
                transit_days=lambda df: (df["date_received"] - df["date_shipped"]).dt.days
            )
            .groupby("supplier_id")
            .agg(
                total_shipments=("shipment_id", "count"),
                avg_qty=("qty", "mean"),
                avg_transit_days=("transit_days", "mean"),
            )
            .reset_index()
        )

        sup = suppliers.merge(ship_agg, on="supplier_id", how="left")

        for _, row in sup.iterrows():
            text = (
                f"SUPPLIER REPORT:\n"
                f"Supplier ID: {int(row['supplier_id'])}\n"
                f"Name: {row['supplier_name']}\n"
                f"On-time rate: {row['on_time_rate']}\n"
                f"Defect rate: {row['defect_rate']}\n"
                f"Lead time (days): {row['lead_time_days']}\n"
                f"Total shipments: {row.get('total_shipments', 0)}\n"
                f"Average shipment quantity: {row.get('avg_qty', 0):.2f}\n"
                f"Average transit days: {row.get('avg_transit_days', 0):.2f}\n"
            )
            meta = {"type": "supplier", "supplier_id": int(row["supplier_id"])}
            docs.append((text, meta))

        return docs

    # -------------------------------------------
    # INDEX BUILDING
    # -------------------------------------------
    def build_index_from_data(self):
        inventory, demand, suppliers, shipments = self._load_data()

        docs_items = self._build_item_docs(inventory, demand)
        docs_suppliers = self._build_supplier_docs(suppliers, shipments)

        docs_all = docs_items + docs_suppliers

        if not docs_all:
            raise ValueError("No documents available to build RAG index.")

        texts = [d[0] for d in docs_all]
        metainfo = [d[1] for d in docs_all]

        embeddings = self.model.encode(texts)
        dim = embeddings.shape[1]

        index = faiss.IndexFlatL2(dim)
        index.add(embeddings)

        self.index = index
        self.chunks = texts
        self.metainfo = metainfo

    # -------------------------------------------
    # QUERY
    # -------------------------------------------
    def query(self, question: str, k: int = 5) -> Tuple[str, str]:
        """
        Returns (answer, context_text)
        """
        if self.index is None or not self.chunks:
            self.build_index_from_data()

        q_emb = self.model.encode([question])
        D, I = self.index.search(q_emb, k)

        retrieved_chunks = [self.chunks[i] for i in I[0]]
        context = "\n\n---\n\n".join(retrieved_chunks)

        # No API key: fallback to context-only mode
        if not self.client:
            answer = (
                "RAG engine is active but no LLM API key is configured.\n\n"
                "Here is the retrieved supply chain context:\n\n"
                f"{context}"
            )
            return answer, context

        prompt = f"""
You are an expert retail supply chain and inventory analyst.

Use the context below, which includes item-level and supplier-level summaries,
to answer the business question in clear, concise, actionable language.

If something is uncertain, say so explicitly. Prioritize insights and recommendations
around stockout risk, excess inventory, promotion impact, shrinkage, supplier risk,
and shipment delays.

Context:
{context}

Question:
{question}

Answer as if you are advising a retail operations director.
"""

        response = self.client.responses.create(
            model=LLM_MODEL,
            input=prompt,
        )

        # Try to pull text cleanly, fallback if structure differs
        answer_text = None
        try:
            # new Responses API style
            if hasattr(response, "output") and response.output:
                content = response.output[0].content[0]
                answer_text = getattr(content, "text", None) or str(content)
            elif hasattr(response, "output_text"):
                answer_text = response.output_text
        except Exception:
            pass

        if not answer_text:
            answer_text = str(response)

        return answer_text, context


# Singleton instance
rag_engine = RAGEngine()
