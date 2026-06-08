import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "../admin-frontend/node_modules/typescript/lib/typescript.js";

process.env.TZ = "UTC";

const source = fs.readFileSync(new URL("../admin-frontend/src/lib/time.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
const time = await import(moduleUrl);

assert.equal(
  time.formatBeijingDateTime("2026-06-08 00:30:00"),
  "2026-06-08 00:30",
);

assert.equal(
  time.formatBeijingDateTime("2026-06-08T00:30:00", { includeYear: false }),
  "06-08 00:30",
);

assert.equal(
  time.formatBeijingTime("2026-06-08 00:30:00"),
  "00:30",
);

assert.equal(
  time.formatBeijingDate("2026-06-07T16:30:00.000Z"),
  "2026-06-08",
);
