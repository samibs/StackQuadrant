import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSoftwareApplicationData,
  buildSoftwareSourceCodeData,
  buildBenchmarkDatasetData,
  buildCollectionPageData,
} from "../json-ld";

test("buildSoftwareApplicationData emits valid Schema.org SoftwareApplication", () => {
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

  assert.equal(data["@context"], "https://schema.org");
  assert.equal(data["@type"], "SoftwareApplication");
  assert.equal(data.name, "Cursor");
  assert.equal(data.applicationCategory, "AI Code Editor");
  assert.deepEqual(data.author, { "@type": "Organization", name: "Anysphere" });
  assert.deepEqual(data.publisher, { "@type": "Organization", name: "Anysphere" });

  const rating = data.aggregateRating as Record<string, unknown>;
  assert.equal(rating.ratingValue, 8.7);
  assert.equal(rating.bestRating, 10);
  assert.equal(rating.worstRating, 0);
  assert.equal(rating.ratingCount, 2);

  const reviews = data.review as Array<Record<string, unknown>>;
  assert.equal(reviews.length, 2);
  assert.equal(reviews[0]["@type"], "Review");
  assert.equal(reviews[0].name, "Code Generation");
});

test("buildSoftwareApplicationData omits rating when score is null", () => {
  const data = buildSoftwareApplicationData({
    name: "Unscored Tool",
    description: "x",
    url: "/tools/unscored",
    category: "Editor",
    score: null,
    vendor: null,
  });
  assert.equal(data.aggregateRating, undefined);
  assert.equal(data.author, undefined);
});

test("buildSoftwareSourceCodeData emits SoftwareSourceCode with codeRepository", () => {
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
  assert.equal(data.programmingLanguage, "Python");
  assert.equal(data.license, "MIT");
  const stat = data.interactionStatistic as Record<string, unknown>;
  assert.equal(stat.userInteractionCount, 90000);
});

test("buildBenchmarkDatasetData emits Dataset with measurementTechnique and Observations", () => {
  const data = buildBenchmarkDatasetData({
    title: "HumanEval",
    description: "Code generation benchmark",
    url: "/benchmarks/humaneval",
    methodology: "Pass@1 on 164 hand-written problems",
    category: "Code Generation",
    variables: [
      { name: "pass@1", unit: "%", higherIsBetter: true },
    ],
    observations: [
      { toolName: "GPT-4", toolUrl: "/tools/gpt-4", metric: "pass@1", unit: "%", value: 88.4, higherIsBetter: true },
      { toolName: "Claude 3.5", toolUrl: "/tools/claude", metric: "pass@1", unit: "%", value: 92.0, higherIsBetter: true },
    ],
  });

  assert.equal(data["@type"], "Dataset");
  assert.equal(data.measurementTechnique, "Pass@1 on 164 hand-written problems");
  const vars = data.variableMeasured as Array<Record<string, unknown>>;
  assert.equal(vars[0]["@type"], "PropertyValue");
  assert.equal(vars[0].unitText, "%");

  const parts = data.hasPart as Array<Record<string, unknown>>;
  assert.equal(parts.length, 2);
  assert.equal(parts[0]["@type"], "Observation");
  assert.equal((parts[1].observationAbout as Record<string, unknown>).name, "Claude 3.5");
});

test("buildCollectionPageData emits CollectionPage with ItemList", () => {
  const data = buildCollectionPageData({
    name: "Best for Debugging",
    description: "Tools that excel at debugging",
    url: "/best-for/debugging",
    itemKind: "SoftwareApplication",
    items: [
      { name: "Cursor", url: "/tools/cursor", description: "AI editor", score: 8.5 },
      { name: "Copilot", url: "/tools/copilot", description: "GitHub Copilot", score: 7.9 },
    ],
  });
  assert.equal(data["@type"], "CollectionPage");
  const mainEntity = data.mainEntity as Record<string, unknown>;
  assert.equal(mainEntity["@type"], "ItemList");
  assert.equal(mainEntity.numberOfItems, 2);
  const items = mainEntity.itemListElement as Array<Record<string, unknown>>;
  assert.equal(items[0].position, 1);
  assert.equal(items[1].position, 2);
  const innerItem = items[0].item as Record<string, unknown>;
  assert.equal(innerItem["@type"], "SoftwareApplication");
  const rating = innerItem.aggregateRating as Record<string, unknown>;
  assert.equal(rating.ratingValue, 8.5);
});

test("buildCollectionPageData handles items without scores", () => {
  const data = buildCollectionPageData({
    name: "Methodology",
    description: "How we score",
    url: "/methodology",
    itemKind: "Article",
    items: [{ name: "Scoring rubric", url: "/methodology/rubric" }],
  });
  const items = ((data.mainEntity as Record<string, unknown>).itemListElement) as Array<Record<string, unknown>>;
  const innerItem = items[0].item as Record<string, unknown>;
  assert.equal(innerItem.aggregateRating, undefined);
});
