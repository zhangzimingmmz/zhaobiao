import logging
logging.basicConfig(level=logging.INFO)
from crawler.site2.tasks.backfill import run

if __name__ == '__main__':
    run("2026-03-14", "2026-03-14", "00101")
