const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const source = readFileSync(path.join(__dirname, "status.ts"), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const context = { exports: {} };
vm.runInNewContext(outputText, context);

 test("approving a brief advances directly to copy review", () => {
  assert.equal(context.exports.advanceStatus("BRIEF_REVIEW"), "COPY_REVIEW");
});

test("approving copy advances to creative review", () => {
  assert.equal(context.exports.advanceStatus("COPY_REVIEW"), "CREATIVE_REVIEW");
});

test("approving creative readies the item for scheduling", () => {
  assert.equal(context.exports.advanceStatus("CREATIVE_REVIEW"), "READY_TO_SCHEDULE");
});

test("terminal states stay terminal", () => {
  assert.equal(context.exports.advanceStatus("ANALYZED"), "ANALYZED");
});
