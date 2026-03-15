from __future__ import annotations

import sys
import urllib.error
import urllib.request


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: http_probe.py <url>", file=sys.stderr)
        return 2

    req = urllib.request.Request(sys.argv[1], method="GET")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return 0 if 200 <= resp.status < 400 else 1
    except urllib.error.URLError as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
