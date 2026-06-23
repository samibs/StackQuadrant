import { test } from "node:test";
import assert from "node:assert/strict";

test("llms.txt route exports a GET handler", async () => {
  const mod = await import("../route");
  assert.equal(typeof mod.GET, "function");
});

test("llms-full.txt route exports a GET handler", async () => {
  const mod = await import("../../llms-full.txt/route");
  assert.equal(typeof mod.GET, "function");
});

test("robots route emits LLM crawler rules including GPTBot, ClaudeBot, PerplexityBot", async () => {
  const mod = await import("../../robots");
  const robots = mod.default();
  assert.ok(Array.isArray(robots.rules));
  const rules = robots.rules as Array<{ userAgent: string | string[] }>;
  const uas = rules.flatMap((r) => Array.isArray(r.userAgent) ? r.userAgent : [r.userAgent]);
  for (const expected of ["*", "GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot"]) {
    assert.ok(uas.includes(expected), `expected robots to advertise ${expected}, got: ${uas.join(", ")}`);
  }
});
