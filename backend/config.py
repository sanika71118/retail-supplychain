#%%
from dotenv import load_dotenv
load_dotenv()
import os
from pathlib import Path



# Base project directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Data folders
DATA_DIR = BASE_DIR / "data"
SYNTHETIC_DIR = DATA_DIR / "synthetic"
PROCESSED_DIR = DATA_DIR / "processed"

# Ensure folders exist
SYNTHETIC_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# RAG / LLM config
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# GPT-5 model
LLM_MODEL = "gpt-4o-mini"

# %%
