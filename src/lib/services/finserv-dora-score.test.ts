import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ageDecay,
  calculateVendorRiskScore,
  DECAY_FLOOR,
  SCORING_MODEL_VERSION,
} from "./finserv-dora-score";

const STACKQUADRANT_WEIGHTS = new Map([
  ["availability", 0.85],
  ["data_integrity", 1.0],
  ["confidentiality", 0.95],
  ["cyber", 1.0],
  ["service_continuity", 0.75],
  ["authenticity", 0.9],
]);

test("scoring model is explicitly versioned", () => {
  assert.equal(SCORING_MODEL_VERSION, "sq-dora-v1");
});

test("zero incidents yields score 0", () => {
  const result = calculateVendorRiskScore([], STACKQUADRANT_WEIGHTS, new Date("2026-06-01T00:00:00Z"));
  assert.equal(result.riskScore, 0);
  assert.equal(result.incidentCount, 0);
});

test("fresh severity-5 cyber incident contributes 5 points", () => {
  const now = new Date("2026-06-01T00:00:00Z");
  const result = calculateVendorRiskScore(
    [{ categoryId: "cyber", severity: 5, occurredAt: now }],
    STACKQUADRANT_WEIGHTS,
    now
  );
  assert.equal(result.riskScore, 5);
});

test("old incidents decay to the configured floor", () => {
  const now = new Date("2026-06-01T00:00:00Z");
  const ancient = new Date(now.getTime() - 800 * 24 * 60 * 60 * 1000);
  assert.equal(ageDecay(ancient, now), DECAY_FLOOR);
});

test("future timestamps do not create negative decay", () => {
  const now = new Date("2026-06-01T00:00:00Z");
  assert.equal(ageDecay(new Date("2026-12-01T00:00:00Z"), now), 1);
});

test("score saturates at 100", () => {
  const now = new Date("2026-06-01T00:00:00Z");
  const incidents = Array.from({ length: 50 }, () => ({
    categoryId: "cyber",
    severity: 5,
    occurredAt: now,
  }));
  assert.equal(calculateVendorRiskScore(incidents, STACKQUADRANT_WEIGHTS, now).riskScore, 100);
});

test("unknown category uses neutral fallback weight", () => {
  const now = new Date("2026-06-01T00:00:00Z");
  const result = calculateVendorRiskScore(
    [{ categoryId: "unknown", severity: 4, occurredAt: now }],
    STACKQUADRANT_WEIGHTS,
    now
  );
  assert.equal(result.riskScore, 2);
});
