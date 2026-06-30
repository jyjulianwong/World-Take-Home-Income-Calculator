import json
import os
import re
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from openai import OpenAI

_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(
            api_key=os.environ["OPENROUTER_API_KEY"],
            base_url="https://openrouter.ai/api/v1",
        )
    return _client


def chat(messages: list[dict], temperature: float = 0.2) -> str:
    model = os.environ.get("OPENROUTER_MODEL", "google/gemini-2.5-flash")
    response = get_client().chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
    )
    return response.choices[0].message.content


_jinja_env: Environment | None = None


def _get_jinja_env() -> Environment:
    global _jinja_env
    if _jinja_env is None:
        prompts_dir = Path(__file__).resolve().parent.parent / "prompts"
        _jinja_env = Environment(loader=FileSystemLoader(str(prompts_dir)), keep_trailing_newline=True)
    return _jinja_env


def render_prompt(template_name: str, **kwargs) -> str:
    return _get_jinja_env().get_template(template_name).render(**kwargs)


def parse_json(raw: str) -> dict:
    """Extract a JSON object from an LLM response, tolerating markdown fences and surrounding text."""
    raw = raw.strip()
    # Try direct parse first
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    # Strip markdown fences
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw)
    if fence:
        try:
            return json.loads(fence.group(1).strip())
        except json.JSONDecodeError:
            pass
    # Grab first {...} block
    obj = re.search(r"\{[\s\S]*\}", raw)
    if obj:
        try:
            return json.loads(obj.group(0))
        except json.JSONDecodeError:
            pass
    raise ValueError(f"Could not parse JSON from LLM response: {raw[:300]}")
