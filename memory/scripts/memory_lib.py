"""Companion-memory file store — library for agent CLI."""

from __future__ import annotations

import json
import math
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:  # pragma: no cover
    yaml = None  # type: ignore

DEFAULT_WEIGHTS = {"recency": 0.35, "importance": 0.25, "relevance": 0.40}
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous",
    r"system\s*:",
    r"<\s*/?\s*system",
    r"you\s+are\s+now",
    r"disregard\s+",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_yaml(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {}
    text = path.read_text(encoding="utf-8")
    if yaml is None:
        raise RuntimeError("PyYAML required: pip install pyyaml")
    data = yaml.safe_load(text)
    return data if isinstance(data, dict) else {}


def dump_yaml(path: Path, data: dict[str, Any]) -> None:
    if yaml is None:
        raise RuntimeError("PyYAML required: pip install pyyaml")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        yaml.safe_dump(data, allow_unicode=True, sort_keys=False, default_flow_style=False),
        encoding="utf-8",
    )


def sanitize_content(text: str, max_len: int = 4000) -> tuple[str, list[str]]:
    warnings: list[str] = []
    lines = []
    for line in text.splitlines():
        lower = line.lower().strip()
        if any(re.search(p, lower) for p in INJECTION_PATTERNS):
            warnings.append(f"stripped_suspicious_line: {line[:80]}")
            continue
        lines.append(line)
    cleaned = "\n".join(lines).strip()[:max_len]
    return cleaned, warnings


def memory_root(root: Path) -> Path:
    return root.resolve()


def paths(root: Path) -> dict[str, Path]:
    r = memory_root(root)
    return {
        "index": r / "index.yaml",
        "persona": r / "core" / "persona.yaml",
        "user_model": r / "core" / "user-model.yaml",
        "relationship": r / "core" / "relationship.yaml",
        "working": r / "core" / "working.yaml",
        "episodes": r / "episodes",
        "inbox": r / "inbox",
        "diary": r / "diary",
        "reflections": r / "reflections",
        "archive": r / "archive" / "sessions",
    }


def is_bootstrapped(root: Path) -> bool:
    p = paths(root)
    return p["index"].is_file() and p["working"].is_file()


def bootstrap(root: Path, persona_name: str = "", mode: str = "companion") -> dict[str, Any]:
    p = paths(root)
    for d in (p["episodes"], p["inbox"], p["diary"], p["reflections"], p["archive"], p["persona"].parent):
        d.mkdir(parents=True, exist_ok=True)

    ts = utc_now()
    dump_yaml(
        p["index"],
        {
            "version": "1.0",
            "updated_at": ts,
            "mode": mode,
            "episode_count": 0,
            "wings": {
                "user": {"rooms": ["identity", "preferences", "boundaries", "life-events"]},
                "relationship": {"rooms": ["milestones", "rituals", "nicknames", "shared-plans"]},
                "ai-persona": {"rooms": ["character", "voice-style", "backstory", "limits"]},
                "sessions": {"rooms": ["summaries", "transcripts"]},
            },
        },
    )
    dump_yaml(
        p["persona"],
        {
            "name": persona_name,
            "traits": [],
            "voice_style": "",
            "backstory": "",
            "limits": ["not a therapist", "no fabricated shared memories"],
            "version": 1,
            "updated_at": ts,
        },
    )
    dump_yaml(
        p["user_model"],
        {
            "identity": {"name": "", "pronouns": "", "timezone": ""},
            "preferences": {},
            "boundaries": {"hard_limits": [], "soft_limits": []},
            "attachment_cues": "",
            "facts": [],
            "updated_at": ts,
        },
    )
    rel: dict[str, Any] = {"updated_at": ts, "milestones": [], "rituals": [], "nicknames": {}, "shared_plans": []}
    if mode == "companion":
        rel["stage"] = ""
        rel["inside_jokes"] = []
        rel["repair_notes"] = []
    dump_yaml(p["relationship"], rel)
    dump_yaml(
        p["working"],
        {
            "session_started_at": ts,
            "relationship_brief": "",
            "retrieved_context": [],
            "pending_saves": [],
        },
    )
    return {"ok": True, "root": str(memory_root(root)), "bootstrapped_at": ts}


def list_episodes(root: Path, include_invalidated: bool = False) -> list[dict[str, Any]]:
    p = paths(root)
    out: list[dict[str, Any]] = []
    if not p["episodes"].is_dir():
        return out
    for f in sorted(p["episodes"].glob("*.yaml")):
        ep = load_yaml(f)
        if not ep:
            continue
        ep["_path"] = str(f)
        if not include_invalidated and ep.get("status") == "invalidated":
            continue
        out.append(ep)
    return out


def parse_ts(ts: str) -> datetime:
    try:
        if ts.endswith("Z"):
            ts = ts[:-1] + "+00:00"
        return datetime.fromisoformat(ts)
    except ValueError:
        return datetime.now(timezone.utc)


def score_episode(ep: dict[str, Any], query: str, weights: dict[str, float] | None = None) -> float:
    w = weights or DEFAULT_WEIGHTS
    q = query.lower()
    tokens = [t for t in re.split(r"\W+", q) if len(t) > 1]
    content = str(ep.get("content", "")).lower()
    tags = " ".join(str(t) for t in ep.get("tags", [])).lower()
    blob = content + " " + tags

    relevance = sum(1 for t in tokens if t in blob) / max(len(tokens), 1) if tokens else 0.0

    ts = parse_ts(str(ep.get("timestamp", utc_now())))
    days = max((datetime.now(timezone.utc) - ts).total_seconds() / 86400, 0)
    recency = math.exp(-0.1 * days)

    importance = float(ep.get("importance", 5)) / 10.0
    return w["recency"] * recency + w["importance"] * importance + w["relevance"] * relevance


def search_episodes(
    root: Path,
    query: str,
    wing: str | None = None,
    limit: int = 8,
) -> list[dict[str, Any]]:
    hits: list[tuple[float, dict[str, Any]]] = []
    for ep in list_episodes(root):
        if wing and ep.get("wing") != wing:
            continue
        s = score_episode(ep, query)
        if s > 0 or not query.strip():
            hits.append((s, ep))
    hits.sort(key=lambda x: -x[0])
    return [{"score": round(s, 4), **ep} for s, ep in hits[:limit]]


def new_episode_id(root: Path) -> str:
    p = paths(root)
    idx = load_yaml(p["index"])
    n = int(idx.get("episode_count", 0)) + 1
    day = datetime.now(timezone.utc).strftime("%Y%m%d")
    return f"ep-{day}-{n:04d}"


def save_episode(
    root: Path,
    wing: str,
    room: str,
    content: str,
    source: str = "user_stated",
    importance: int = 5,
    tags: list[str] | None = None,
    to_inbox: bool = False,
    invalidates: str | None = None,
) -> dict[str, Any]:
    cleaned, warnings = sanitize_content(content)
    if not cleaned:
        return {"ok": False, "error": "empty_content_after_sanitize", "warnings": warnings}

    p = paths(root)
    if not is_bootstrapped(root):
        bootstrap(root)

    eid = new_episode_id(root)
    ts = utc_now()
    episode: dict[str, Any] = {
        "id": eid,
        "timestamp": ts,
        "wing": wing,
        "room": room,
        "content": cleaned,
        "importance": max(1, min(10, importance)),
        "source": source,
        "status": "active",
        "tags": tags or [],
    }
    if invalidates:
        episode["invalidates"] = invalidates
        invalidate_episode(root, invalidates, superseded_by=eid)

    dest_dir = p["inbox"] if to_inbox else p["episodes"]
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / f"{eid}.yaml"
    dump_yaml(dest, episode)

    if not to_inbox:
        idx = load_yaml(p["index"])
        idx["episode_count"] = int(idx.get("episode_count", 0)) + 1
        idx["updated_at"] = ts
        dump_yaml(p["index"], idx)

    return {"ok": True, "id": eid, "path": str(dest), "inbox": to_inbox, "warnings": warnings}


def invalidate_episode(root: Path, episode_id: str, superseded_by: str | None = None) -> bool:
    p = paths(root)
    for base in (p["episodes"], p["inbox"]):
        f = base / f"{episode_id}.yaml"
        if f.is_file():
            ep = load_yaml(f)
            ep["status"] = "invalidated"
            ep["invalidated_at"] = utc_now()
            if superseded_by:
                ep["superseded_by"] = superseded_by
            dump_yaml(f, ep)
            return True
    return False


def promote_inbox(root: Path, episode_id: str) -> dict[str, Any]:
    p = paths(root)
    src = p["inbox"] / f"{episode_id}.yaml"
    if not src.is_file():
        return {"ok": False, "error": "inbox_not_found"}
    ep = load_yaml(src)
    ep["status"] = "active"
    ep["promoted_at"] = utc_now()
    dst = p["episodes"] / f"{episode_id}.yaml"
    dump_yaml(dst, ep)
    src.unlink()
    idx = load_yaml(p["index"])
    idx["episode_count"] = int(idx.get("episode_count", 0)) + 1
    idx["updated_at"] = utc_now()
    dump_yaml(p["index"], idx)
    return {"ok": True, "id": episode_id, "path": str(dst)}


def build_brief(root: Path, max_chars: int = 1200) -> str:
    p = paths(root)
    persona = load_yaml(p["persona"])
    user = load_yaml(p["user_model"])
    rel = load_yaml(p["relationship"])
    parts = []
    if persona.get("name"):
        parts.append(f"AI persona: {persona.get('name')} — {persona.get('voice_style', '')}")
    ident = user.get("identity", {})
    if ident.get("name"):
        parts.append(f"User: {ident.get('name')}")
    if rel.get("stage"):
        parts.append(f"Relationship stage: {rel.get('stage')}")
    ms = rel.get("milestones", [])
    if ms:
        parts.append(f"Recent milestone: {ms[-1]}")
    nick = rel.get("nicknames", {})
    if nick:
        parts.append(f"Nicknames: {nick}")
    text = " | ".join(parts)[:max_chars]
    return text


def wakeup(root: Path, query: str | None = None) -> dict[str, Any]:
    p = paths(root)
    if not is_bootstrapped(root):
        bootstrap(root)

    brief = build_brief(root)
    working = load_yaml(p["working"])
    working["session_started_at"] = utc_now()
    working["relationship_brief"] = brief

    recent = list_episodes(root)[:5]
    retrieved: list[dict[str, Any]] = []
    if query:
        retrieved = search_episodes(root, query, limit=8)
        working["retrieved_context"] = [
            {"id": r.get("id"), "score": r.get("score"), "content": r.get("content")} for r in retrieved
        ]
    dump_yaml(p["working"], working)

    diary_entries = sorted(p["diary"].glob("*.md"))[-1:] if p["diary"].is_dir() else []
    return {
        "ok": True,
        "relationship_brief": brief,
        "persona": load_yaml(p["persona"]),
        "user_model_summary": {
            "identity": load_yaml(p["user_model"]).get("identity", {}),
            "preferences": load_yaml(p["user_model"]).get("preferences", {}),
        },
        "relationship_summary": {
            "stage": load_yaml(p["relationship"]).get("stage"),
            "milestones": load_yaml(p["relationship"]).get("milestones", [])[-3:],
        },
        "recent_episode_ids": [e.get("id") for e in recent],
        "retrieved": retrieved,
        "latest_diary": diary_entries[0].read_text(encoding="utf-8")[:800] if diary_entries else "",
    }


def wind_down(root: Path, summary: str, diary_note: str = "") -> dict[str, Any]:
    p = paths(root)
    if not is_bootstrapped(root):
        bootstrap(root)
    ts = utc_now()
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    sid = f"sess-{uuid.uuid4().hex[:8]}"
    archive_path = p["archive"] / f"{day}-{sid}.md"
    archive_path.parent.mkdir(parents=True, exist_ok=True)
    archive_path.write_text(f"# Session {sid}\n\n_at: {ts}_\n\n{summary.strip()}\n", encoding="utf-8")

    diary_path = p["diary"] / f"{day}.md"
    block = f"\n\n## {ts}\n{diary_note.strip() or summary.strip()}\n"
    if diary_path.is_file():
        diary_path.write_text(diary_path.read_text(encoding="utf-8") + block, encoding="utf-8")
    else:
        diary_path.write_text(f"# Agent diary {day}\n{block}", encoding="utf-8")

    working = load_yaml(p["working"])
    working["retrieved_context"] = []
    working["session_ended_at"] = ts
    dump_yaml(p["working"], working)
    return {"ok": True, "archive": str(archive_path), "diary": str(diary_path)}


def validate_store(root: Path) -> dict[str, Any]:
    errors: list[str] = []
    p = paths(root)
    for name, fp in [
        ("index", p["index"]),
        ("persona", p["persona"]),
        ("user_model", p["user_model"]),
        ("relationship", p["relationship"]),
        ("working", p["working"]),
    ]:
        if not fp.is_file():
            errors.append(f"missing_{name}")

    for ep in list_episodes(root, include_invalidated=True):
        for req in ("id", "timestamp", "wing", "room", "content", "source"):
            if req not in ep:
                errors.append(f"episode_{ep.get('id', '?')}_missing_{req}")

    return {"ok": len(errors) == 0, "errors": errors, "episode_count": len(list_episodes(root, include_invalidated=True))}


def status(root: Path) -> dict[str, Any]:
    p = paths(root)
    inbox_count = len(list(p["inbox"].glob("*.yaml"))) if p["inbox"].is_dir() else 0
    return {
        "bootstrapped": is_bootstrapped(root),
        "root": str(memory_root(root)),
        "episode_count": len(list_episodes(root)),
        "inbox_pending": inbox_count,
        "index": load_yaml(p["index"]) if p["index"].is_file() else {},
    }
