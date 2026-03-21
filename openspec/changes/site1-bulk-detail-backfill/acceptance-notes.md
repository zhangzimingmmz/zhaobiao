## Acceptance Notes

- `detail_backfill` 现在默认按 `002001009 -> 002001001 -> 002002001` 顺序执行，可重复传入 `--category` 覆盖默认顺序。
- 任务支持 `--batch-size`、`--sleep-seconds`、`--max-failures` 和 `--dry-run`，适合生产分批执行。
- 只会处理 `raw_json` 中尚未包含 `_detail` 且 `linkurl` 非空的 `site1` 记录，天然支持断点续跑。
- 验证通过：
  - `python3 -m unittest tests.test_site1_detail_ingestion`
  - `python3 -m unittest tests.test_detail_content_rendering`
