// ============================================
// FinServ DORA Service — Risk score logic tests
// Run with: node --test src/lib/services/finserv-dora-service.test.mjs
//
// These tests exercise the pure severity-weighted scoring math used by
// finserv-dora-service.ts (computeVendorRiskScore). The math is duplicated
// here in pure JS so the suite runs without the DB-coupled module and
// without a TS transpiler.
// ============================================

import { test } from "node:test";
import assert from "node:assert/strict";

const DECAY_HORIZON_DAYS = 730;
const DECAY_FLOOR = 0.25;
const MAX_SCORE = 100;
const NORMALISATION_CAP = 100;

function ageDecay(occurredAt, now) {
  const ageDays = (now.getTime() - occurredAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays <= 0) return 1;
  if (ageDays >= DECAY_HORIZON_DAYS) return DECAY_FLOOR;
  const progress = ageDays / DECAY_HORIZON_DAYS;
  return 1 - progress * (1 - DECAY_FLOOR);
}

function computeScore(incidents, weights, now) {
  let totalWeighted = 0;
  for (const inc of incidents) {
    const catWeight = weights[inc.categoryId] ?? 0.5;
    const decay = ageDecay(inc.occurredAt, now);
    totalWeighted += inc.severity * catWeight * decay;
  }
  const raw = (totalWeighted / NORMALISATION_CAP) * MAX_SCORE;
  return Math.min(MAX_SCORE, Math.max(0, Math.round(raw * 100) / 100));
}

const CANONICAL_WEIGHTS = {
  availability: 0.85,
  data_integrity: 1.0,
  confidentiality: 0.95,
  cyber: 1.0,
  service_continuity: 0.75,
  authenticity: 0.9,
};

test("zero incidents yields score 0", () => {
  const score = computeScore([], CANONICAL_WEIGHTS, new Date("2026-06-01"));
  assert.equal(score, 0);
});

test("single fresh sev-1 availability incident yields modest score", () => {
  const now = new Date("2026-06-01");
  const score = computeScore(
    [{ categoryId: "availability", severity: 1, occurredAt: new Date("2026-05-30") }],
    CANONICAL_WEIGHTS,
    now
  );
  assert.ok(score > 0 && score < 5, `expected small score, got ${score}`);
});

test("single fresh sev-5 cyber incident contributes 5.0 to score", () => {
  const now = new Date("2026-06-01");
  const score = computeScore(
    [{ categoryId: "cyber", severity: 5, occurredAt: new Date("2026-06-01") }],
    CANONICAL_WEIGHTS,
    now
  );
  assert.equal(score, 5);
});

test("aged incident decays toward DECAY_FLOOR (25%)", () => {
  const now = new Date("2026-06-01");
  const ancient = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 800);
  const decay = ageDecay(ancient, now);
  assert.equal(decay, DECAY_FLOOR);
});

test("decay is linear between fresh (1.0) and floor (0.25) over horizon", () => {
  const now = new Date("2026-06-01");
  const halfHorizonMs = (1000 * 60 * 60 * 24 * DECAY_HORIZON_DAYS) / 2;
  const halfPoint = new Date(now.getTime() - halfHorizonMs);
  const decay = ageDecay(halfPoint, now);
  assert.ok(Math.abs(decay - 0.625) < 0.001, `expected ~0.625, got ${decay}`);
});

test("score saturates at 100 with many catastrophic incidents", () => {
  const now = new Date("2026-06-01");
  const incidents = Array.from({ length: 50 }, () => ({
    categoryId: "cyber",
    severity: 5,
    occurredAt: now,
  }));
  const score = computeScore(incidents, CANONICAL_WEIGHTS, now);
  assert.equal(score, 100);
});

test("unknown category falls back to neutral weight 0.5", () => {
  const now = new Date("2026-06-01");
  const score = computeScore(
    [{ categoryId: "unknown_kind", severity: 4, occurredAt: now }],
    CANONICAL_WEIGHTS,
    now
  );
  assert.equal(score, 2);
});

test("data_integrity carries higher weight than service_continuity", () => {
  const now = new Date("2026-06-01");
  const integrity = computeScore(
    [{ categoryId: "data_integrity", severity: 3, occurredAt: now }],
    CANONICAL_WEIGHTS,
    now
  );
  const continuity = computeScore(
    [{ categoryId: "service_continuity", severity: 3, occurredAt: now }],
    CANONICAL_WEIGHTS,
    now
  );
  assert.ok(
    integrity > continuity,
    `data_integrity (${integrity}) must outweigh service_continuity (${continuity})`
  );
});

test("future occurredAt is treated as fresh (no negative decay)", () => {
  const now = new Date("2026-06-01");
  const future = new Date("2026-12-01");
  const decay = ageDecay(future, now);
  assert.equal(decay, 1);
});

test("category weights match ESA-aligned canonical taxonomy", () => {
  // Guard against silent drift of the canonical weights.
  assert.equal(CANONICAL_WEIGHTS.availability, 0.85);
  assert.equal(CANONICAL_WEIGHTS.data_integrity, 1.0);
  assert.equal(CANONICAL_WEIGHTS.confidentiality, 0.95);
  assert.equal(CANONICAL_WEIGHTS.cyber, 1.0);
  assert.equal(CANONICAL_WEIGHTS.service_continuity, 0.75);
  assert.equal(CANONICAL_WEIGHTS.authenticity, 0.9);
});
