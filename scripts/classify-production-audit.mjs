import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const expectedBlockedPackages = {
  next: {
    severity: "high",
    direct: true,
    viaPackages: ["postcss", "sharp"],
  },
  postcss: {
    severity: "high",
    direct: false,
  },
  sharp: {
    severity: "high",
    direct: false,
  },
};

function packageNames(report) {
  return Object.keys(report.vulnerabilities ?? {}).sort();
}

export function classifyAudit(report, auditExitCode) {
  const counts = report.metadata?.vulnerabilities ?? {};
  const names = packageNames(report);
  if (
    auditExitCode === 0 &&
    names.length === 0 &&
    Number(counts.total ?? 0) === 0
  ) {
    return {
      result: "PASS",
      classification: "PRODUCTION_AUDIT_CLEAR",
      productionReleaseBlocked: false,
      packages: [],
    };
  }

  const expectedNames = Object.keys(expectedBlockedPackages).sort();
  assert.deepEqual(
    names,
    expectedNames,
    `production audit package set changed: ${names.join(", ")}`,
  );
  assert.equal(auditExitCode, 1, "known blocked audit must exit 1");
  assert.equal(counts.high, 3, "known audit high count changed");
  assert.equal(counts.critical, 0, "production audit gained a critical finding");
  assert.equal(counts.total, 3, "known audit total changed");

  for (const [name, expected] of Object.entries(expectedBlockedPackages)) {
    const finding = report.vulnerabilities[name];
    assert.equal(finding.severity, expected.severity, `${name} severity changed`);
    assert.equal(finding.isDirect, expected.direct, `${name} directness changed`);
    if (expected.viaPackages) {
      const viaPackages = (finding.via ?? [])
        .filter((item) => typeof item === "string")
        .sort();
      assert.deepEqual(viaPackages, expected.viaPackages, `${name} dependency path changed`);
    }
  }

  return {
    result: "PASS",
    classification: "BLOCKED_KNOWN_UPSTREAM",
    productionReleaseBlocked: true,
    packages: names,
    high: counts.high,
    critical: counts.critical,
  };
}

function selfTest() {
  assert.equal(
    classifyAudit(
      {
        vulnerabilities: {},
        metadata: {
          vulnerabilities: {
            info: 0,
            low: 0,
            moderate: 0,
            high: 0,
            critical: 0,
            total: 0,
          },
        },
      },
      0,
    ).classification,
    "PRODUCTION_AUDIT_CLEAR",
  );

  const known = {
    vulnerabilities: {
      next: {
        severity: "high",
        isDirect: true,
        via: ["postcss", "sharp"],
      },
      postcss: {
        severity: "high",
        isDirect: false,
        via: [],
      },
      sharp: {
        severity: "high",
        isDirect: false,
        via: [],
      },
    },
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 0,
        high: 3,
        critical: 0,
        total: 3,
      },
    },
  };
  assert.equal(
    classifyAudit(known, 1).classification,
    "BLOCKED_KNOWN_UPSTREAM",
  );
  assert.throws(() =>
    classifyAudit(
      {
        ...known,
        vulnerabilities: {
          ...known.vulnerabilities,
          unexpected: {
            severity: "critical",
            isDirect: false,
            via: [],
          },
        },
      },
      1,
    ),
  );
  console.log(JSON.stringify({ selfTest: "PASS", cases: 3 }, null, 2));
}

if (process.argv.includes("--self-test")) {
  selfTest();
} else {
  const audit =
    process.platform === "win32"
      ? spawnSync(
          process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe",
          ["/d", "/s", "/c", "npm audit --omit=dev --json"],
          { encoding: "utf8", shell: false },
        )
      : spawnSync("npm", ["audit", "--omit=dev", "--json"], {
          encoding: "utf8",
          shell: false,
        });
  if (audit.error) throw audit.error;
  let report;
  try {
    report = JSON.parse(audit.stdout);
  } catch {
    throw new Error(
      `npm audit did not return JSON (exit ${audit.status}): ${audit.stderr}`,
    );
  }
  const result = classifyAudit(report, audit.status);
  console.log(JSON.stringify(result, null, 2));
}
