import os

from ddgs import DDGS

from .llm import chat, parse_json, render_prompt

_MAX_RESULTS = int(os.environ.get("WTHIC_DDGS_MAX_RESULTS", "10"))


def _search(query: str) -> list[dict]:
    try:
        with DDGS() as ddgs:
            return list(ddgs.text(query, max_results=_MAX_RESULTS))
    except Exception:
        return []


def _format_snippets(results: list[dict]) -> list[str]:
    out = []
    for r in results:
        if not r.get("body"):
            continue
        out.append(f"URL: {r.get('href', '')}\nTitle: {r['title']}\nExcerpt: {r['body']}")
    return out


def calculate_take_home(country: str, gross_annual: int, currency: str) -> dict:
    queries = [
        f"{country} income tax rates 2025 brackets",
        f"{country} national insurance social security mandatory contributions 2025",
    ]
    snippets: list[str] = []
    for q in queries:
        snippets.extend(_format_snippets(_search(q)))

    prompt = render_prompt(
        "tax_calculate.j2",
        country=country,
        gross_annual=gross_annual,
        currency=currency,
        snippets="\n\n---\n\n".join(snippets) if snippets else "No search results available.",
    )

    data = parse_json(chat([{"role": "user", "content": prompt}]))

    # Enforce arithmetic consistency
    data["take_home_annual"] = gross_annual - data["total_deductions"]
    data["take_home_monthly"] = round(data["take_home_annual"] / 12)
    data["effective_tax_rate"] = round(data["total_deductions"] / gross_annual, 4)
    return data
