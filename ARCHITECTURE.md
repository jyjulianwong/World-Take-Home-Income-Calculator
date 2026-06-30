# Architecture

## Data flow

```mermaid
flowchart TD
    User(["User\n(Browser)"])

    subgraph Frontend ["Frontend — React / Vite"]
        Form["InputForm\njob_role · country1 · country2"]
        SSE["SSE consumer\n(fetch + ReadableStream)"]
        Progress["ProgressTracker"]
        Results["ResultsDisplay"]
    end

    subgraph Backend ["Backend — FastAPI"]
        API["POST /api/compare\nStreamingResponse"]

        subgraph SalaryService ["salary.py"]
            DDG1["DuckDuckGo search\n(salary queries × 2 per country)"]
            LLM1["LLM — extract\naverage · median · range · currency"]
        end

        subgraph TaxService ["tax.py"]
            DDG2["DuckDuckGo search\n(tax policy queries × 2 per country)"]
            LLM2["LLM — calculate\ndeductions · take-home"]
        end
    end

    subgraph External ["External services"]
        DDGAPI["DuckDuckGo\n(web search)"]
        OR["OpenRouter API\n(LLM inference)"]
    end

    User -->|"fills form"| Form
    Form -->|"POST JSON"| API

    API -->|"progress SSE"| SSE
    SSE --> Progress

    API --> DDG1
    DDG1 -->|"search queries"| DDGAPI
    DDGAPI -->|"result snippets"| DDG1
    DDG1 -->|"snippets"| LLM1
    LLM1 -->|"prompts"| OR
    OR -->|"structured JSON"| LLM1
    LLM1 -->|"salary data"| API

    API --> DDG2
    DDG2 -->|"search queries"| DDGAPI
    DDGAPI -->|"result snippets"| DDG2
    DDG2 -->|"snippets"| LLM2
    LLM2 -->|"prompts"| OR
    OR -->|"structured JSON"| LLM2
    LLM2 -->|"tax + take-home"| API

    API -->|"result SSE"| SSE
    SSE --> Results
    Results --> User
```

## Request lifecycle

1. User submits the form → `POST /api/compare` with `{job_role, country1, country2}`
2. Backend opens an SSE stream and processes steps sequentially, emitting a `progress` event before each step
3. **Salary (country 1):** two DuckDuckGo queries → snippets fed to LLM → returns `{average, median, range, currency, confidence}`
4. **Salary (country 2):** same process for the second country
5. **Tax (country 1):** two DuckDuckGo queries for current tax rates → LLM calculates all mandatory deductions → Python enforces `take_home = gross − total_deductions`
6. **Tax (country 2):** same process
7. Backend emits a final `result` event with the complete comparison payload
8. Frontend renders side-by-side `ResultsDisplay` cards; the country with higher take-home is highlighted
