import os
import re
import json
import urllib.parse
import httpx
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://gradmap.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

claude = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# Tool schema — Claude decides when to call this based on whether an office address
# appears in the prompt. Origin and destination are both Claude-determined.
COMMUTE_TOOL = {
    "name": "get_commute_time",
    "description": (
        "Look up the real transit commute time between two addresses using the Google Maps "
        "Routes API. Call this for each recommended neighborhood when the user has provided "
        "an office or company address. Do not call it if no destination was given."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "origin": {
                "type": "string",
                "description": "The neighborhood address, e.g. 'Williamsburg, Brooklyn, New York, NY'",
            },
            "destination": {
                "type": "string",
                "description": "The office/destination address the user provided",
            },
        },
        "required": ["origin", "destination"],
    },
}


async def get_commute_time(origin: str, destination: str) -> str:
    import traceback
    maps_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not maps_key:
        return "Commute time unavailable (GOOGLE_MAPS_API_KEY not set)"

    request_body = {
        "origins": [{"waypoint": {"address": origin}}],
        "destinations": [{"waypoint": {"address": destination}}],
        "travelMode": "TRANSIT",
    }
    print(f"\n[DEBUG] get_commute_time called")
    print(f"[DEBUG] origin: {origin}")
    print(f"[DEBUG] destination: {destination}")
    print(f"[DEBUG] request body: {request_body}")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
                headers={
                    "X-Goog-Api-Key": maps_key,
                    "X-Goog-FieldMask": "originIndex,destinationIndex,duration,distanceMeters,condition",
                    "Content-Type": "application/json",
                },
                json=request_body,
            )
            print(f"[DEBUG] HTTP status: {r.status_code}")
            print(f"[DEBUG] response body: {r.text}")

            results = r.json()
            if isinstance(results, list) and results:
                route = results[0]
                if route.get("condition") == "ROUTE_EXISTS" and "duration" in route:
                    seconds = int(str(route["duration"]).rstrip("s"))
                    minutes = round(seconds / 60)
                    return f"{minutes} min by transit"
            return "No transit route found"
    except Exception as e:
        print(f"[DEBUG] exception: {e}")
        print(f"[DEBUG] traceback: {traceback.format_exc()}")
        return "Commute time unavailable"


class AnalyzeRequest(BaseModel):
    prompt: str
    officeAddress: Optional[str] = None  # embedded in prompt; kept for logging


class CensusRequest(BaseModel):
    censusUrl: str


class JobsRequest(BaseModel):
    role: str
    cities: list[str]


class EmailRequest(BaseModel):
    summary: str
    neighborhoods: list
    city: str
    salary: int
    userEmail: str


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    try:
        # Always expose the commute tool — Claude decides whether to call it
        # based on whether an office address appears in the prompt.
        messages = [{"role": "user", "content": req.prompt}]
        total_input_tokens = 0
        total_output_tokens = 0

        while True:
            response = claude.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1500,
                tools=[COMMUTE_TOOL],
                messages=messages,
            )
            total_input_tokens += response.usage.input_tokens
            total_output_tokens += response.usage.output_tokens

            if response.stop_reason == "end_turn":
                text = next(b.text for b in response.content if hasattr(b, "text"))
                return {
                    "text": text,
                    "usage": {
                        "input_tokens": total_input_tokens,
                        "output_tokens": total_output_tokens,
                    },
                }

            tool_results = []
            for block in response.content:
                if block.type == "tool_use" and block.name == "get_commute_time":
                    commute = await get_commute_time(
                        block.input["origin"], block.input["destination"]
                    )
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": commute,
                    })

            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/email")
async def send_email(req: EmailRequest):
    mcp_url = os.environ.get("ZAPIER_MCP_URL")
    mcp_token = os.environ.get("ZAPIER_MCP_TOKEN")
    if not mcp_url or not mcp_token:
        raise HTTPException(
            status_code=503,
            detail="Add ZAPIER_MCP_URL and ZAPIER_MCP_TOKEN to your environment variables.",
        )

    neighborhood_text = "\n".join([
        f"- {n.get('name', '')}{' (' + n['borough'] + ')' if n.get('borough') else ''}: "
        f"{n.get('rentRange', '')} · {n.get('commuteTime', 'commute not available')} · {n.get('vibe', '')}"
        for n in req.neighborhoods
    ])

    prompt = (
        f"Please send an email to {req.userEmail} with the subject "
        f"'Your GradMap results for {req.city}' containing a clean, readable summary "
        f"of these neighborhood recommendations.\n\n"
        f"City: {req.city}\n"
        f"Salary: ${req.salary:,}\n\n"
        f"Summary:\n{req.summary}\n\n"
        f"Neighborhoods:\n{neighborhood_text}\n\n"
        f"Format it as a friendly, skimmable email — use short paragraphs and clear sections."
    )

    try:
        response = claude.beta.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            betas=["mcp-client-2025-11-20"],
            mcp_servers=[{
                "type": "url",
                "url": mcp_url,
                "name": "zapier-gmail",
                "authorization_token": mcp_token,
            }],
            tools=[{
                "type": "mcp_toolset",
                "mcp_server_name": "zapier-gmail",
            }],
            messages=[{"role": "user", "content": prompt}],
        )

        # Log the full response so Render's logs show exactly what Claude did
        print(f"[EMAIL] stop_reason: {response.stop_reason}")
        if response.stop_reason == "max_tokens":
            print("[EMAIL] FAIL — response truncated (max_tokens). Tool call likely incomplete.")
            raise HTTPException(
                status_code=502,
                detail="Claude's response was truncated before completing the Gmail tool call. Check Render logs.",
            )

        for i, block in enumerate(response.content):
            block_type = getattr(block, "type", type(block).__name__)
            print(f"[EMAIL] content[{i}] type={block_type}")
            if block_type == "text":
                print(f"[EMAIL] content[{i}] text={getattr(block, 'text', '')[:300]}")
            elif block_type in ("tool_use", "mcp_tool_use"):
                print(f"[EMAIL] content[{i}] name={getattr(block, 'name', '?')} input={getattr(block, 'input', '?')}")
            elif block_type in ("tool_result", "mcp_tool_result"):
                print(f"[EMAIL] content[{i}] content={getattr(block, 'content', '?')}")
            else:
                try:
                    print(f"[EMAIL] content[{i}] raw={block.model_dump()}")
                except Exception:
                    print(f"[EMAIL] content[{i}] raw={block}")

        # Verify Claude actually called a tool — plain text means the MCP connection
        # succeeded but no Gmail action was taken, which is still a failure for us
        tool_called = any(
            getattr(b, "type", "") in ("tool_use", "mcp_tool_use")
            for b in response.content
        )
        if not tool_called:
            text_preview = next(
                (getattr(b, "text", "")[:200] for b in response.content if getattr(b, "type", "") == "text"),
                "(no text block)",
            )
            print(f"[EMAIL] FAIL — no tool call found. Claude replied with plain text: {text_preview}")
            raise HTTPException(
                status_code=502,
                detail="Claude did not invoke the Gmail tool — email was not sent. Check Render logs for the full response.",
            )

        return {"sent": True, "to": req.userEmail}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[DEBUG] Claude MCP error: {type(e).__name__}: {str(e)}")
        print(f"[DEBUG] {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


class InboxScanRequest(BaseModel):
    access_token: str
    max_results: int = 50


@app.get("/oauth/google")
async def oauth_google():
    client_id = os.environ.get("GOOGLE_OAUTH_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=503, detail="GOOGLE_OAUTH_CLIENT_ID not configured")
    api_base = os.environ.get("API_BASE_URL", "http://localhost:8000")
    redirect_uri = f"{api_base}/oauth/callback"
    params = urllib.parse.urlencode({
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/gmail.readonly",
        "access_type": "offline",
        "prompt": "consent",
    })
    return {"auth_url": f"https://accounts.google.com/o/oauth2/auth?{params}"}


@app.get("/oauth/callback")
async def oauth_callback(code: str = None, error: str = None):
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    if error or not code:
        msg = urllib.parse.quote(error or "unknown")
        return RedirectResponse(f"{frontend_url}?inbox_error={msg}")

    client_id = os.environ.get("GOOGLE_OAUTH_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET")
    api_base = os.environ.get("API_BASE_URL", "http://localhost:8000")
    redirect_uri = f"{api_base}/oauth/callback"

    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        data = r.json()

    if "error" in data:
        msg = urllib.parse.quote(data.get("error_description", data["error"]))
        return RedirectResponse(f"{frontend_url}?inbox_error={msg}")

    token = urllib.parse.quote(data["access_token"])
    return RedirectResponse(f"{frontend_url}?inbox_token={token}")


@app.post("/inbox-scan")
async def inbox_scan(req: InboxScanRequest):
    token = req.access_token
    auth_header = {"Authorization": f"Bearer {token}"}

    # Subject-based search covers the most reliable signal; the body-phrase OR
    # clause catches confirmations where the subject is generic ("Your submission").
    # No date filter so it reaches back through the full job-search history.
    SEARCH_QUERY = (
        'subject:("thank you for applying" OR "application received" OR '
        '"application submitted" OR "application confirmation" OR '
        '"we received your application" OR "your application" OR applied) '
        'OR ("thank you for applying" OR "we received your application" OR '
        '"we\'ve received your application" OR "application received" OR '
        '"application submitted" OR "application confirmation")'
    )
    cap = min(req.max_results, 50)

    print(f"[INBOX] Gmail search query: {SEARCH_QUERY}")
    print(f"[INBOX] Requesting up to {cap} matching messages")

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages",
            headers=auth_header,
            params={"q": SEARCH_QUERY, "maxResults": cap},
        )
        print(f"[INBOX] messages list HTTP status: {r.status_code}")
        if r.status_code == 401:
            raise HTTPException(status_code=401, detail="Gmail token expired. Please reconnect.")
        if r.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Gmail API error {r.status_code}: {r.text[:200]}")

        message_ids = [m["id"] for m in r.json().get("messages", [])]
        print(f"[INBOX] Gmail returned {len(message_ids)} matching message(s)")
        if not message_ids:
            return {"jobs": [], "scanned": 0}

        raw_emails = []
        for mid in message_ids:
            mr = await client.get(
                f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{mid}",
                headers=auth_header,
                params={"format": "metadata", "metadataHeaders": ["Subject", "Date", "From"]},
            )
            if mr.status_code == 200:
                raw_emails.append(mr.json())

    def extract_summary(msg):
        hdrs = {h["name"].lower(): h["value"] for h in msg.get("payload", {}).get("headers", [])}
        return {
            "subject": hdrs.get("subject", ""),
            "date": hdrs.get("date", ""),
            "from": hdrs.get("from", ""),
            "snippet": msg.get("snippet", ""),
        }

    emails = [extract_summary(m) for m in raw_emails]
    print(f"[INBOX] Fetched metadata for {len(emails)} message(s)")
    for e in emails[:5]:
        print(f"[INBOX] Subject: {e['subject'][:80]}")

    SUPPORTED = (
        "New York NY, San Francisco CA, Los Angeles CA, Chicago IL, Seattle WA, "
        "Austin TX, Boston MA, Washington DC, Miami FL, Denver CO, Atlanta GA, "
        "Nashville TN, Raleigh NC"
    )
    emails_text = "\n\n".join([
        f"[{i+1}] From: {e['from']}\nSubject: {e['subject']}\nDate: {e['date']}\nPreview: {e['snippet']}"
        for i, e in enumerate(emails)
    ])

    def parse_jobs_from_text(text: str) -> list:
        try:
            m = re.search(r'\[.*\]', text, re.DOTALL)
            return json.loads(m.group()) if m else json.loads(text)
        except (json.JSONDecodeError, AttributeError):
            print(f"[INBOX] JSON parse failed on: {text[:300]}")
            return []

    # ── PASS 1: extraction — no tools, one fast call ──────────────────────────
    print(f"[INBOX] Pass 1: extracting from {len(emails)} emails (no tool calls)")
    p1_response = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8096,
        messages=[{"role": "user", "content": (
            f"These are job-search emails. For each one that is clearly related to a job application, extract:\n"
            f"- company (required)\n"
            f"- role (required)\n"
            f"- location: normalize to one of these if it matches: {SUPPORTED}. Otherwise use the raw location or null.\n"
            f"- salary: if explicitly mentioned, otherwise null\n"
            f"- source_date: YYYY-MM-DD\n"
            f"- status: classify as exactly one of these four values based on the email content:\n"
            f"  'applied'   — initial application confirmation (default if none of the below match)\n"
            f"  'rejected'  — contains language like 'unfortunately', 'not moving forward', 'regret to inform', 'not selected', 'decided to move forward with other candidates', 'position has been filled'\n"
            f"  'interview' — contains language like 'next steps', 'schedule an interview', 'phone screen', 'interview request', 'move you forward', 'speak with you'\n"
            f"  'offer'     — contains language like 'offer', 'congratulations', 'pleased to offer', 'compensation package'\n\n"
            f"Skip emails not related to job applications. "
            f"Return only a JSON array. No markdown, no explanation.\n\n"
            f"Emails:\n{emails_text}"
        )}],
    )
    print(f"[INBOX] Pass 1 stop_reason: {p1_response.stop_reason}")
    p1_text = next((b.text for b in p1_response.content if hasattr(b, "text")), "[]")
    print(f"[INBOX] Pass 1 preview: {p1_text[:200]}")
    jobs = parse_jobs_from_text(p1_text)
    print(f"[INBOX] Pass 1 extracted {len(jobs)} jobs")

    # ── PASS 2: enrichment — web_search for missing fields, capped ───────────
    ENRICH_CAP = 8
    serpapi_key = os.environ.get("SERPAPI_KEY")
    needs_enrich = [j for j in jobs if not j.get("salary") or not j.get("location")]
    enrich_targets = needs_enrich[:ENRICH_CAP]
    skipped_enrich = len(needs_enrich) - len(enrich_targets)

    print(
        f"[INBOX] Pass 2: {len(enrich_targets)} jobs need enrichment "
        f"({skipped_enrich} skipped — over cap of {ENRICH_CAP}), "
        f"serpapi={'yes' if serpapi_key else 'no'}"
    )

    searches_done = 0

    if enrich_targets and serpapi_key:
        enrich_items = "\n\n".join([
            f"[{i}] {j.get('company','?')} — {j.get('role','?')} | "
            f"location: {j.get('location') or 'unknown'} | salary: {j.get('salary') or 'unknown'}"
            for i, j in enumerate(enrich_targets)
        ])
        enrich_prompt = (
            f"For each job below, use web_search to find the missing salary range and/or "
            f"office location. Make at most one search per job. "
            f"Return a JSON array in the same order with updated salary and location fields only.\n\n"
            f"Jobs:\n{enrich_items}"
        )
        WEB_SEARCH_TOOL = {
            "name": "web_search",
            "description": "Search for a company's typical salary range or office location.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "e.g. 'Stripe Software Engineer salary New York 2024'"},
                },
                "required": ["query"],
            },
        }
        messages = [{"role": "user", "content": enrich_prompt}]

        while True:
            p2_response = claude.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=4096,
                tools=[WEB_SEARCH_TOOL],
                messages=messages,
            )
            print(f"[INBOX] Pass 2 stop_reason: {p2_response.stop_reason}, searches_done={searches_done}")

            if p2_response.stop_reason == "end_turn":
                p2_text = next((b.text for b in p2_response.content if hasattr(b, "text")), "[]")
                enriched = parse_jobs_from_text(p2_text)
                # Merge enriched fields back — enrich_targets items are refs into jobs
                for idx, upd in enumerate(enriched):
                    if idx < len(enrich_targets):
                        if upd.get("salary"):
                            enrich_targets[idx]["salary"] = upd["salary"]
                        if upd.get("location"):
                            enrich_targets[idx]["location"] = upd["location"]
                break

            if p2_response.stop_reason == "tool_use":
                tool_results = []
                for block in p2_response.content:
                    if block.type == "tool_use" and block.name == "web_search":
                        if searches_done >= ENRICH_CAP:
                            print(f"[INBOX] Enrichment cap ({ENRICH_CAP}) reached, blocking search")
                            tool_results.append({
                                "type": "tool_result",
                                "tool_use_id": block.id,
                                "content": "Search limit reached for this request.",
                            })
                            continue
                        searches_done += 1
                        query = block.input.get("query", "")
                        print(f"[INBOX] web_search [{searches_done}/{ENRICH_CAP}]: {query}")
                        try:
                            async with httpx.AsyncClient(timeout=10) as sc:
                                sr = await sc.get(
                                    "https://serpapi.com/search.json",
                                    params={"engine": "google", "q": query, "num": "3", "api_key": serpapi_key},
                                )
                                snippets = [r.get("snippet", "") for r in (sr.json().get("organic_results") or [])[:3]]
                                result_text = " | ".join(snippets) if snippets else "No results"
                        except Exception as se:
                            result_text = f"Search error: {se}"
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": result_text,
                        })
                messages.append({"role": "assistant", "content": p2_response.content})
                messages.append({"role": "user", "content": tool_results})
                continue

            print(f"[INBOX] Pass 2 unexpected stop_reason: {p2_response.stop_reason}")
            break

    print(
        f"[INBOX] Done: {len(jobs)} jobs, "
        f"{searches_done} enrichment searches run, "
        f"{skipped_enrich} skipped (cap={ENRICH_CAP})"
    )
    return {"jobs": jobs, "scanned": len(emails), "enriched": searches_done, "skipped_enrich": skipped_enrich}


@app.post("/census")
async def census(req: CensusRequest):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(req.censusUrl, timeout=10)
            r.raise_for_status()
            return {"data": r.json()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/jobs")
async def jobs(req: JobsRequest):
    serpapi_key = os.environ.get("SERPAPI_KEY")
    if not serpapi_key:
        raise HTTPException(status_code=500, detail="SERPAPI_KEY not configured")

    results = []
    async with httpx.AsyncClient(timeout=15) as client:
        for city in req.cities:
            try:
                q = f"{req.role} in {city}"
                r = await client.get(
                    "https://serpapi.com/search.json",
                    params={"engine": "google_jobs", "q": q, "num": "5", "api_key": serpapi_key},
                )
                data = r.json()
                for job in (data.get("jobs_results") or [])[:5]:
                    extensions = job.get("detected_extensions") or {}
                    links = job.get("related_links") or []
                    results.append({
                        "title": job.get("title"),
                        "company": job.get("company_name"),
                        "location": job.get("location"),
                        "city": city,
                        "salary": extensions.get("salary"),
                        "posted": extensions.get("posted_at"),
                        "description": (job.get("description") or "")[:200],
                        "applyLink": links[0].get("link") if links else None,
                    })
            except Exception:
                continue

    return {"jobs": results}
