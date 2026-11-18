const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

test("sidans statiska texter finns i textfilen", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const source = fs.readFileSync(path.join(__dirname, "content.js"), "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context);

  const bindings = [...html.matchAll(/data-(?:text|math|aria-label|content)="([^"]+)"/g)];
  assert.ok(bindings.length > 0);
  for (const [, key] of bindings) {
    assert.equal(typeof context.window.LessonContent.text[key], "string", `Saknad text: ${key}`);
    assert.notEqual(context.window.LessonContent.text[key], "", `Tom text: ${key}`);
  }

  const literalText = [...html.matchAll(/>([^<]+)</g)]
    .map(match => match[1].trim())
    .filter(value => /[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(value));
  assert.deepEqual(literalText, []);
});
