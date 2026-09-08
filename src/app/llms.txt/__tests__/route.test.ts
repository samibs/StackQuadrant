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

test("robots distinguishes retrieval crawlers from training crawlers", async () => {
  const mod = await import("../../robots");
  const robots = mod.default();
  assert.ok(Array.isArray(robots.rules));
  const rules = robots.rules as Array<{ userAgent: string | string[]; allow?: string; disallow?: string | string[] }>;

  const findRule = (userAgent: string) => rules.find((rule) =>
    Array.isArray(rule.userAgent) ? rule.userAgent.includes(userAgent) : rule.userAgent === userAgent
  );

  assert.equal(findRule("OAI-SearchBot")?.allow, "/");
  assert.equal(findRule("Claude-SearchBot")?.allow, "/");
  assert.equal(findRule("PerplexityBot")?.allow, "/");
  assert.equal(findRule("GPTBot")?.disallow, "/");
  assert.equal(findRule("ClaudeBot")?.disallow, "/");
  assert.equal(findRule("CCBot")?.disallow, "/");
});
