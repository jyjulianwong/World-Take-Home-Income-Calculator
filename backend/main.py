import asyncio
import json
import os
from collections.abc import AsyncGenerator

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

load_dotenv()

from services.salary import fetch_salary_data
from services.tax import calculate_take_home

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CompareRequest(BaseModel):
    job_role: str
    country1: str
    country2: str


def sse(event_type: str, payload: dict) -> str:
    return f"data: {json.dumps({'type': event_type, **payload})}\n\n"


async def stream_comparison(req: CompareRequest) -> AsyncGenerator[str, None]:
    try:
        yield sse("progress", {"step": "salary_1", "status": "active", "message": f"Searching salaries in {req.country1}…"})
        salary1 = await asyncio.to_thread(fetch_salary_data, req.job_role, req.country1)
        yield sse("progress", {"step": "salary_1", "status": "done", "data": salary1})

        yield sse("progress", {"step": "salary_2", "status": "active", "message": f"Searching salaries in {req.country2}…"})
        salary2 = await asyncio.to_thread(fetch_salary_data, req.job_role, req.country2)
        yield sse("progress", {"step": "salary_2", "status": "done", "data": salary2})

        gross1 = salary1.get("average") or salary1.get("median")
        gross2 = salary2.get("average") or salary2.get("median")

        if not gross1:
            yield sse("error", {"message": f"Could not find salary data for {req.country1}. Try a different role or country."})
            return
        if not gross2:
            yield sse("error", {"message": f"Could not find salary data for {req.country2}. Try a different role or country."})
            return

        yield sse("progress", {"step": "tax_1", "status": "active", "message": f"Fetching tax policy for {req.country1}…"})
        tax1 = await asyncio.to_thread(calculate_take_home, req.country1, gross1, salary1["currency"])
        yield sse("progress", {"step": "tax_1", "status": "done", "data": tax1})

        yield sse("progress", {"step": "tax_2", "status": "active", "message": f"Fetching tax policy for {req.country2}…"})
        tax2 = await asyncio.to_thread(calculate_take_home, req.country2, gross2, salary2["currency"])
        yield sse("progress", {"step": "tax_2", "status": "done", "data": tax2})

        result = {
            "job_role": req.job_role,
            "countries": [
                {
                    "name": req.country1,
                    "currency": salary1["currency"],
                    "currency_symbol": salary1["currency_symbol"],
                    "gross_annual": gross1,
                    "gross_monthly": round(gross1 / 12),
                    "salary_data": salary1,
                    "tax": tax1,
                },
                {
                    "name": req.country2,
                    "currency": salary2["currency"],
                    "currency_symbol": salary2["currency_symbol"],
                    "gross_annual": gross2,
                    "gross_monthly": round(gross2 / 12),
                    "salary_data": salary2,
                    "tax": tax2,
                },
            ],
        }
        yield sse("result", {"data": result})

    except Exception as e:
        yield sse("error", {"message": str(e)})


@app.get("/api/rates")
async def get_rates(from_currency: str = Query(..., min_length=3, max_length=3)):
    currency = from_currency.upper()
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"https://open.er-api.com/v6/latest/{currency}")
    data = r.json()
    if data.get("result") != "success":
        raise HTTPException(status_code=400, detail=f"Unsupported or unknown currency: {currency}")
    rates = data["rates"]
    rates[currency] = 1.0  # ensure base is present
    return {"rates": rates}


@app.post("/api/compare")
async def compare(req: CompareRequest):
    return StreamingResponse(
        stream_comparison(req),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
