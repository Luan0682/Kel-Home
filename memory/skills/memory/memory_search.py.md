# MD 兼容视图 — `memory_search.py`

> **权威源文件**：同目录 `memory_search.py`（本文件由 `skill-core` 自动生成，请勿手改；改源文件后重新 `batch build` 或运行 compat 同步。）

| 项 | 值 |
|----|-----|
| 类型 | `py` |
| 路径 | `scripts/memory_search.py` |
| 用途 | companion-memory 脚本；Agent 通过 memory_cli.py 调用。 |

## 内容

```python
#!/usr/bin/env python3
"""Legacy wrapper — prefer: python memory_cli.py search --query ..."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from memory_lib import search_episodes


def main() -> int:
    p = argparse.ArgumentParser(description="Search companion-memory episodes")
    p.add_argument("--root", default="memory", type=Path)
    p.add_argument("--query", required=True)
    p.add_argument("--wing", default=None)
    p.add_argument("--limit", type=int, default=8)
    args = p.parse_args()
    for h in search_episodes(args.root, args.query, wing=args.wing, limit=args.limit):
        print(f"{h.get('score', 0):.2f}\t{h.get('id')}\t{str(h.get('content', ''))[:200]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## 运行

```bash
python scripts/memory_search.py
```

Skill Steps 引用路径：`scripts/memory_search.py` 或 `refs/scripts/memory_search.py`（编译后位于 `references/refs/`）。
