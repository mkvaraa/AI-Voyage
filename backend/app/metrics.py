from prometheus_client import Counter

gemini_api_calls_total = Counter(
    "gemini_api_calls_total",
    "Total number of successful Gemini API calls",
)
