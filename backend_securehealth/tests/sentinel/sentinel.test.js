import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSignals } from "../../services/sentinelService.js";

test("Sentinel detects all planned anomalous behaviors", () => {
  const rules = evaluateSignals({ accessCount: 51, deniedCount: 5, downloadCount: 20, hour: 2, organizationMismatch: true }).map((x) => x.rule);
  assert.deepEqual(rules, ["HIGH_ACCESS_VOLUME", "REPEATED_DENIED_REQUESTS", "BULK_DOWNLOAD", "OFF_HOURS_ACCESS", "CROSS_ORGANIZATION_ACTIVITY"]);
});
test("Sentinel does not classify ordinary activity as suspicious", () => assert.deepEqual(evaluateSignals({ accessCount: 2, deniedCount: 0, downloadCount: 1, hour: 12 }), []));

