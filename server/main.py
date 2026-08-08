import os
import json
import httpx
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
            max_tokens=1000,
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
