import { SandboxReport } from "./types";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

export class SandboxReporter {
  constructor(private outputDir: string) {
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
  }

  generateMarkdown(report: SandboxReport): string {
    const { scenarioId, timestamp, result, verification, validationResults } = report;
    const date = new Date(timestamp).toISOString();

    let md = `# Sandbox Report: ${scenarioId}\n\n`;
    md += `- **Timestamp:** ${date}\n`;
    md += `- **Duration:** ${result.metrics.durationMs}ms\n`;
    md += `- **Status:** ${verification.passed ? "✅ PASSED" : "❌ FAILED"}\n`;
    md += `- **Overall Score:** ${verification.score}/100\n\n`;

    md += `## Agent Output\n\n\`\`\`\n${result.output}\n\`\`\`\n\n`;

    md += `## Behavioral Verification\n\n`;
    md += `- **Reason:** ${verification.reason}\n`;
    md += `- **Findings:**\n`;
    verification.findings.forEach(f => md += `  - ${f}\n`);
    md += `\n`;

    md += `## Validation Results\n\n`;
    md += `| Validator | Status | Message |\n`;
    md += `|-----------|--------|---------|\n`;
    validationResults.forEach(v => {
      md += `| ${v.name} | ${v.passed ? "✅" : "❌"} | ${v.message || "-"} |\n`;
    });
    md += `\n`;

    md += `## Tool Calls (${result.toolCalls.length})\n\n`;
    md += `| Tool | Args | Response | Time |\n`;
    md += `|------|------|----------|------|\n`;
    result.toolCalls.forEach(c => {
      const args = JSON.stringify(c.args).slice(0, 50) + (JSON.stringify(c.args).length > 50 ? "..." : "");
      const resp = JSON.stringify(c.response).slice(0, 50) + (JSON.stringify(c.response).length > 50 ? "..." : "");
      md += `| ${c.tool} | \`${args}\` | \`${resp}\` | ${new Date(c.timestamp).toLocaleTimeString()} |\n`;
    });

    return md;
  }

  saveReport(report: SandboxReport) {
    const filename = `report-${report.scenarioId}-${Date.now()}.md`;
    const content = this.generateMarkdown(report);
    writeFileSync(join(this.outputDir, filename), content);
    console.log(`[Reporter] Report saved to ${join(this.outputDir, filename)}`);
    return join(this.outputDir, filename);
  }
}
