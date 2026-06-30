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


def fetch_salary_data(job_role: str, country: str) -> dict:
    queries = [
        f"{job_role} average salary {country} 2024 2025",
        f"{job_role} salary {country} glassdoor payscale linkedin",
        f"{job_role} compensation {country}",
    ]
    snippets: list[str] = []
    for q in queries:
        snippets.extend(_format_snippets(_search(q)))

    has_web_data = bool(snippets)

    if has_web_data:
        prompt = render_prompt(
            "salary_extract.j2",
            job_role=job_role,
            country=country,
            snippets="\n\n---\n\n".join(snippets),
        )
    else:
        prompt = render_prompt(
            "salary_llm_estimate.j2",
            job_role=job_role,
            country=country,
            reason="No live web search results were available.",
            note="Estimated from model training data; no live search results were available.",
        )

    data = parse_json(chat([{"role": "user", "content": prompt}]))

    # If web search ran but LLM still returned no figures, fall back to model knowledge
    if has_web_data and not (data.get("average") or data.get("median")):
        prompt = render_prompt(
            "salary_llm_estimate.j2",
            job_role=job_role,
            country=country,
            reason="Web search snippets were available but contained no usable salary figures.",
            note="Web search returned no usable figures; estimated from model training data.",
        )
        data = parse_json(chat([{"role": "user", "content": prompt}]))

    return data
