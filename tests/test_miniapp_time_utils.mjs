import assert from "node:assert/strict";
import fs from "node:fs";

const code = fs.readFileSync(new URL("../miniapp/src/utils/formatDate.js", import.meta.url), "utf8");
const moduleUrl = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
const time = await import(moduleUrl);

assert.equal(
  time.formatBeijingDate(new Date("2026-06-07T16:30:00.000Z")),
  "2026-06-08",
);

assert.deepEqual(
  time.buildBeijingTimeFilter("today", new Date("2026-06-07T16:30:00.000Z")),
  {
    timeStart: "2026-06-08 00:00:00",
    timeEnd: "2026-06-08 23:59:59",
  },
);

assert.deepEqual(
  time.buildBeijingTimeFilter("3d", new Date("2026-06-07T16:30:00.000Z")),
  {
    timeStart: "2026-06-06 00:00:00",
    timeEnd: "2026-06-08 23:59:59",
  },
);

assert.equal(
  time.formatDateTime("2026-06-07T16:30:00.000Z"),
  "2026-06-08 00:30",
);
