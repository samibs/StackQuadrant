// ============================================
// Register Domain Configurations
// Run: npx tsx scripts/register-domains.ts
// ============================================

import "dotenv/config";
import { registerDomain } from "../src/lib/engine/domain-registry";
import { domainConfigs } from "../src/config/domains";

async function main() {
  console.log(`Registering ${domainConfigs.length} domain(s)...`);

  for (const config of domainConfigs) {
    console.log(`  Registering: ${config.id} (${config.name})`);
    await registerDomain(config);
    console.log(`  Done: ${config.id} — ${config.scoringDimensions.length} dimensions`);
  }

  console.log("\nAll domains registered.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Failed to register domains:", e);
  process.exit(1);
});
