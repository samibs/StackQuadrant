import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  SoftwareApplicationJsonLd,
  SoftwareSourceCodeJsonLd,
  BenchmarkDatasetJsonLd,
  CollectionPageJsonLd,
  BreadcrumbJsonLd,
} from "../json-ld";

test("SoftwareApplicationJsonLd renders <script type=application/ld+json>", () => {
  const html = renderToStaticMarkup(
    SoftwareApplicationJsonLd({
      name: "Test",
      description: "Test tool",
      url: "/tools/test",
      category: "Editor",
      score: 8.0,
      vendor: "Acme",
    })
  );
  assert.match(html, /<script type="application\/ld\+json">/);
  assert.match(html, /"@type":"SoftwareApplication"/);
  assert.match(html, /"ratingValue":8/);
});

test("SoftwareSourceCodeJsonLd renders Schema.org SoftwareSourceCode", () => {
  const html = renderToStaticMarkup(
    SoftwareSourceCodeJsonLd({
      name: "test-repo",
      description: "Test repo",
      url: "/repos/test",
      codeRepository: "https://github.com/x/y",
      programmingLanguage: "TypeScript",
      license: "MIT",
      score: 7.0,
      stars: 1000,
    })
  );
  assert.match(html, /"@type":"SoftwareSourceCode"/);
  assert.match(html, /"codeRepository":"https:\/\/github.com\/x\/y"/);
});

test("BenchmarkDatasetJsonLd renders Dataset with Observations", () => {
  const html = renderToStaticMarkup(
    BenchmarkDatasetJsonLd({
      title: "B",
      description: "D",
      url: "/benchmarks/b",
      methodology: "M",
      category: "Code Generation",
      variables: [{ name: "pass", unit: "%", higherIsBetter: true }],
      observations: [
        { toolName: "T1", toolUrl: "/tools/t1", metric: "pass", unit: "%", value: 50, higherIsBetter: true },
      ],
    })
  );
  assert.match(html, /"@type":"Dataset"/);
  assert.match(html, /"@type":"Observation"/);
});

test("CollectionPageJsonLd renders CollectionPage + ItemList", () => {
  const html = renderToStaticMarkup(
    CollectionPageJsonLd({
      name: "Cat",
      description: "Cat desc",
      url: "/best-for/cat",
      itemKind: "SoftwareApplication",
      items: [{ name: "T", url: "/tools/t", score: 7.5 }],
    })
  );
  assert.match(html, /"@type":"CollectionPage"/);
  assert.match(html, /"@type":"ItemList"/);
});

test("BreadcrumbJsonLd renders BreadcrumbList", () => {
  const html = renderToStaticMarkup(
    BreadcrumbJsonLd({ items: [{ name: "Home", href: "/" }, { name: "Tools", href: "/tools" }] })
  );
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.match(html, /"position":1/);
  assert.match(html, /"position":2/);
});

test("JsonLd escapes < to prevent </script> breakout", () => {
  const html = renderToStaticMarkup(
    SoftwareApplicationJsonLd({
      name: "</script><img src=x>",
      description: "x",
      url: "/tools/x",
      category: "Editor",
      score: null,
      vendor: null,
    })
  );
  assert.ok(!html.includes("</script><img"), "raw </script> must not appear in JSON-LD payload");
  // Confirm the dangerous `<` was escaped before the closing tag of the JSON-LD script.
  assert.match(html, /\\u003c\/script>/);
});
