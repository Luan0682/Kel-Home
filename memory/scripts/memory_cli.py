#!/usr/bin/env python3
"""Agent CLI for companion-memory — bootstrap, wakeup, search, save, wind-down."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from memory_lib import (
    bootstrap,
    invalidate_episode,
    is_bootstrapped,
    promote_inbox,
    save_episode,
    search_episodes,
    status,
    validate_store,
    wakeup,
    wind_down,
)


def _print(data: dict, as_json: bool) -> None:
    if as_json:
        print(json.dumps(data, ensure_ascii=False, indent=2))
    else:
        for k, v in data.items():
            print(f"{k}: {v}")


def cmd_bootstrap(args: argparse.Namespace) -> int:
    r = bootstrap(args.root, persona_name=args.persona_name or "", mode=args.mode)
    _print(r, args.json)
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    _print(status(args.root), args.json)
    return 0


def cmd_wakeup(args: argparse.Namespace) -> int:
    if not is_bootstrapped(args.root) and not args.no_bootstrap:
        bootstrap(args.root)
    _print(wakeup(args.root, query=args.query), args.json)
    return 0


def cmd_search(args: argparse.Namespace) -> int:
    hits = search_episodes(args.root, args.query, wing=args.wing, limit=args.limit)
    if args.json:
        print(json.dumps({"ok": True, "hits": hits}, ensure_ascii=False, indent=2))
    else:
        for h in hits:
            print(f"{h.get('score', 0):.3f}\t{h.get('id')}\t{h.get('content', '')[:120]}")
    return 0


def cmd_save(args: argparse.Namespace) -> int:
    if not is_bootstrapped(args.root):
        bootstrap(args.root)
    to_inbox = not args.confirm and not args.yes
    r = save_episode(
        args.root,
        wing=args.wing,
        room=args.room,
        content=args.content,
        source=args.source,
        importance=args.importance,
        tags=[t.strip() for t in args.tags.split(",") if t.strip()] if args.tags else None,
        to_inbox=to_inbox,
        invalidates=args.invalidates,
    )
    _print(r, args.json)
    return 0 if r.get("ok") else 1


def cmd_inbox_list(args: argparse.Namespace) -> int:
    inbox = args.root / "inbox"
    items = []
    if inbox.is_dir():
        for f in sorted(inbox.glob("*.yaml")):
            items.append({"id": f.stem, "path": str(f)})
    _print({"ok": True, "inbox": items}, args.json)
    return 0


def cmd_inbox_promote(args: argparse.Namespace) -> int:
    _print(promote_inbox(args.root, args.id), args.json)
    return 0


def cmd_invalidate(args: argparse.Namespace) -> int:
    ok = invalidate_episode(args.root, args.id, superseded_by=args.superseded_by)
    _print({"ok": ok, "id": args.id}, args.json)
    return 0 if ok else 1


def cmd_wind_down(args: argparse.Namespace) -> int:
    _print(wind_down(args.root, summary=args.summary, diary_note=args.diary or ""), args.json)
    return 0


def cmd_validate(args: argparse.Namespace) -> int:
    r = validate_store(args.root)
    _print(r, args.json)
    return 0 if r.get("ok") else 1


def main() -> int:
    p = argparse.ArgumentParser(description="Companion-memory agent CLI")
    p.add_argument("--root", type=Path, default=Path("memory"))
    p.add_argument("--json", action="store_true", help="JSON output for agent parsing")

    sub = p.add_subparsers(dest="cmd", required=True)

    b = sub.add_parser("bootstrap", help="Create memory/ tree")
    b.add_argument("--persona-name", default="")
    b.add_argument("--mode", choices=["companion", "assistant"], default="companion")
    b.set_defaults(func=cmd_bootstrap)

    s = sub.add_parser("status")
    s.set_defaults(func=cmd_status)

    w = sub.add_parser("wakeup", help="Session start — load brief + optional search")
    w.add_argument("--query", default=None)
    w.add_argument("--no-bootstrap", action="store_true")
    w.set_defaults(func=cmd_wakeup)

    sr = sub.add_parser("search")
    sr.add_argument("--query", required=True)
    sr.add_argument("--wing", default=None)
    sr.add_argument("--limit", type=int, default=8)
    sr.set_defaults(func=cmd_search)

    sv = sub.add_parser("save")
    sv.add_argument("--wing", required=True)
    sv.add_argument("--room", required=True)
    sv.add_argument("--content", required=True)
    sv.add_argument("--importance", type=int, default=5)
    sv.add_argument("--source", default="user_stated")
    sv.add_argument("--tags", default="")
    sv.add_argument("--invalidates", default=None, help="episode id to invalidate")
    sv.add_argument("--confirm", action="store_true", help="write to episodes not inbox")
    sv.add_argument("--yes", action="store_true", help="alias for --confirm")
    sv.set_defaults(func=cmd_save)

    il = sub.add_parser("inbox-list")
    il.set_defaults(func=cmd_inbox_list)

    ip = sub.add_parser("inbox-promote")
    ip.add_argument("--id", required=True)
    ip.set_defaults(func=cmd_inbox_promote)

    inv = sub.add_parser("invalidate")
    inv.add_argument("--id", required=True)
    inv.add_argument("--superseded-by", default=None)
    inv.set_defaults(func=cmd_invalidate)

    wd = sub.add_parser("wind-down", help="Session end — archive + diary")
    wd.add_argument("--summary", required=True)
    wd.add_argument("--diary", default="")
    wd.set_defaults(func=cmd_wind_down)

    v = sub.add_parser("validate")
    v.set_defaults(func=cmd_validate)

    args = p.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
