# ai_assistant/config.py

import os
from dotenv import load_dotenv

# This line loads the environment variables from your .env file.
# It's smart enough to find the .env file in your project root.
load_dotenv()

# --- Gemini AI Configuration ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- Supabase Database Configuration ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


# --- Sanity Check ---
# We add a check to ensure the application fails loudly and early
# if any of the required secret keys are missing.
if not GEMINI_API_KEY:
    raise ValueError("Missing required environment variable: GEMINI_API_KEY")
if not SUPABASE_URL:
    raise ValueError("Missing required environment variable: SUPABASE_URL")
if not SUPABASE_KEY:
    raise ValueError("Missing required environment variable: SUPABASE_KEY")