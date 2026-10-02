/**
 * Is the database reachable, upgraded and stocked?   npm run db:check
 */
import "./load-env";
import { dbHealth, healthAdvice } from "./health";

async function main() {
  const h = await dbHealth();
  if (h.reachable) {
    console.log(`✓ database reachable`);
    console.log(h.missing.length ? `✗ missing tables: ${h.missing.join(", ")}` : "✓ all tables present");
    console.log(`  upcoming club nights: ${h.upcomingNights}`);
    console.log(`  upcoming events:      ${h.upcomingEvents}`);
  }
  const advice = healthAdvice(h);
  if (advice.length) {
    console.log("\nTo fix:");
    advice.forEach((a) => console.log("  • " + a));
    process.exit(1);
  }
  console.log("\n✓ all good");
  process.exit(0);
}

main();
