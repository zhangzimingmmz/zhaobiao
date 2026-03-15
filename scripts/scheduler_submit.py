from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

ROUTINE_ACTIONS = {
    "site1.incremental",
    "site1.recovery",
    "site2.incremental",
    "site2.recovery",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Submit a routine crawl action to the admin control plane."
    )
    parser.add_argument("action_key", choices=sorted(ROUTINE_ACTIONS))
    parser.add_argument(
        "--base-url",
        default=os.environ.get("API_BASE_URL", "http://api:8000"),
        help="Control-plane base URL, defaults to API_BASE_URL.",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=float(os.environ.get("SCHEDULER_SUBMIT_TIMEOUT_SECONDS", "20")),
        help="HTTP timeout in seconds.",
    )
    parser.add_argument(
        "--token",
        default=os.environ.get("ADMIN_TOKEN"),
        help="Bearer token. Defaults to ADMIN_TOKEN.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.token:
        print("Missing scheduler auth token.", file=sys.stderr)
        return 2

    endpoint = args.base_url.rstrip("/") + "/api/admin/crawl/runs"
    body = json.dumps({"actionKey": args.action_key, "params": {}}).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {args.token}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=args.timeout) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        print(f"HTTP {exc.code}: {detail}", file=sys.stderr)
        return 1
    except urllib.error.URLError as exc:
        print(f"Request failed: {exc}", file=sys.stderr)
        return 1

    print(json.dumps(payload, ensure_ascii=False))
    if payload.get("code") != 200:
        return 1

    run = (payload.get("data") or {})
    status = run.get("status")
    if status in {"queued", "running"}:
        return 0

    if status == "rejected":
        print(run.get("statusReason") or "Run was rejected", file=sys.stderr)
        return 2

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
