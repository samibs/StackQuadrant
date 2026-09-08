import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSoftwareApplicationData,
  buildSoftwareSourceCodeData,
  buildBenchmarkDatasetData,
  buildCollectionPageData,
} from "../json-ld";

test("software application emits one editorial review, not one review per dimension", () => {
  const data = buildSoftwareApplicationData({
    name: "Cursor",
    description: "AI code editor",
    url: "/tools/cursor",
    category: "AI Code Editor",
    score: 8.7,
    vendor: "Anysphere",
    reviews: [
      { dimension: "Code Generation", score: 9, evidence: "Top-tier completions" },
      { dimension: "Debugging", score: 8, evidence: "Solid root-cause analysis" },
    ],
  });

  assert.equal(data["@type"], "SoftwareApplication");
  assert.equal(data.aggregateRating, undefined);
  assert.deepEqual(data.author, { "@type": "Organization", name: "Anysphere" });

  const review = data.review as Record<string, unknown>;
  assert.equal(review["@type"], "Review");
  const rating = review.reviewRating as Record<string, unknown>;
  assert.equal(rating.ratingValue, 8.7);
  assert.match(String(review.reviewBody), /Code Generation: 9\/10/);
  assert.match(String(review.reviewBody), /Debugging: 8\/10/);
});

test("unscored software omits editorial review", () => {
  const data = buildSoftwareApplicationData({
    name: "Unscored Tool",
    description: "x",
    url: "/tools/unscored",
    category: "Editor",
    score: null,
    vendor: null,
  });
  assert.equal(data.review, undefined);
  assert.equal(data.aggregateRating, undefined);
});

test("software source code keeps repository metadata and one editorial review", () => {
  const data = buildSoftwareSourceCodeData({
    name: "langchain",
    description: "LLM framework",
    url: "/repos/langchain",
    codeRepository: "https://github.com/langchain-ai/langchain",
    programmingLanguage: "Python",
    license: "MIT",
    score: 7.4,
    category: "LLM Framework",
    stars: 90000,
    reviews: [{ dimension: "Adoption", score: 9, evidence: "Widely used" }],
  });
  assert.equal(data["@type"], "SoftwareSourceCode");
  assert.equal(data.codeRepository, "https://github.com/langchain-ai/langchain");
  assert.equal(data.aggregateRating, undefined);
  const stat = data.interactionStatistic as Record<string, unknown>;
  assert.equal(stat.userInteractionCount, 90000);
  const review = data.review as Record<string, unknown>;
  assert.equal(review["@type"], "Review");
});

test("benchmark dataset emits observations without inventing a license", () => {
  const data = buildBenchmarkDatasetData({
    title: "HumanEval",
    description: "Code generation benchmark",
    url: "/benchmarks/humaneval",
    methodology: "Pass@1 on 164 hand-written problems",
    category: "Code Generation",
    variables: [{ name: "pass@1", unit: "%", higherIsBetter: true }],
    observations: [
      { toolName: "GPT-4", toolUrl: "/tools/gpt-4", metric: "pass@1", unit: "%", value: 88.4, higherIsBetter: true },
      { toolName: "Claude 3.5", toolUrl: "/tools/claude", metric: "pass@1", unit: "%", value: 92.0, higherIsBetter: true },
    ],
  });
  assert.equal(data["@type"], "Dataset");
  assert.equal(data.license, undefined);
  const parts = data.hasPart as Array<Record<string, unknown>>;
  assert.equal(parts.length, 2);
  assert.equal(parts[0]["@type"], "Observation");
});

test("collection items do not invent aggregate ratings", () => {
  const data = buildCollectionPageData({
    name: "Best for Debugging",
    description: "Tools that excel at debugging",
    url: "/best-for/debugging",
    itemKind: "SoftwareApplication",
    items: [{ name: "Cursor", url: "/tools/cursor", description: "AI editor", score: 8.5 }],
  });
  const mainEntity = data.mainEntity as Record<string, unknown>;
  const items = mainEntity.itemListElement as Array<Record<string, unknown>>;
  const innerItem = items[0].item as Record<string, unknown>;
  assert.equal(innerItem.aggregateRating, undefined);
  assert.equal(innerItem.review, undefined);
});
