from prometheus_client import Counter

gemini_api_calls_total = Counter(
    "gemini_api_calls_total",
    "Total Gemini API calls",
    ["status", "model"],
)
