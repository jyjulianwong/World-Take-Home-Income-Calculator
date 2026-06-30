# World Take-Home Income Comparison

Compare estimated take-home salaries for a job role across two countries, accounting for local income tax and mandatory contributions.

## Requirements

- Python 3.12+ with [uv](https://docs.astral.sh/uv/)
- Node.js 18+
- An [OpenRouter](https://openrouter.ai) API key

## Setup

**Backend**
```bash
cd backend
cp .env.example .env
# Fill in your OPENROUTER_API_KEY
uv sync
```

**Frontend**
```bash
cd frontend
npm install
```

## Running

```bash
# Terminal 1
cd backend && uv run uvicorn main:app --reload

# Terminal 2
cd frontend && npm run dev
```

Open http://localhost:5173.

## Usage

Enter a job role (including seniority, company, and sector) and two countries. The app searches for salary data in each country, applies local tax rules, and returns estimated annual and monthly take-home pay side by side.
