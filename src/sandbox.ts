import { Agent, AgentResult, SandboxConfig, Scenario, SandboxReport, BehaviorVerification } from "./types";

export class BehavioralSandbox {
  private config: SandboxConfig;

  constructor(config: Partial<SandboxConfig> = {}) {
    this.config = {
      maxDurationMs: 60000,
      allowedTools: ["*"],
      mockResponses: {},
      interceptNetwork: true,
      ...config,
    };
  }

  async runScenario(agent: Agent, scenario: Scenario): Promise<SandboxReport> {
    const startTime = Date.now();
    console.log(`[Sandbox] Running scenario: ${scenario.name} (${scenario.id})`);

    let result: AgentResult;
    try {
      // Execute agent with timeout protection
      result = await this.executeWithTimeout(
        () => agent.run(scenario.input),
        this.config.maxDurationMs
      );
    } catch (error: any) {
      console.error(`[Sandbox] Agent execution failed: ${error.message}`);
      result = {
        output: `Error: ${error.message}`,
        toolCalls: [],
        metrics: {
          startTime,
          endTime: Date.now(),
          durationMs: Date.now() - startTime,
        },
      };
    }

    // Run behavior verification
    const verification = scenario.expectedBehavior 
      ? scenario.expectedBehavior(result)
      : this.defaultVerification(result);

    // Run individual validators
    const validationResults = [];
    if (scenario.validators) {
      for (const validator of scenario.validators) {
        const vResult = await validator.validate(result);
        validationResults.push({
          name: validator.name,
          ...vResult,
        });
      }
    }

    return {
      scenarioId: scenario.id,
      timestamp: Date.now(),
      result,
      verification,
      validationResults,
    };
  }

  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Sandbox execution timeout")), timeoutMs)
      ),
    ]);
  }

  private defaultVerification(result: AgentResult): BehaviorVerification {
    const findings: string[] = [];
    let score = 100;

    if (result.output.length === 0) {
      findings.push("Agent produced no output.");
      score -= 50;
    }

    if (result.metrics.durationMs > this.config.maxDurationMs * 0.8) {
      findings.push("Agent execution was near timeout threshold.");
      score -= 10;
    }

    return {
      passed: score >= 70,
      score,
      reason: score >= 70 ? "Basic execution successful" : "Execution issues detected",
      findings,
    };
  }

  /**
   * Utility to verify tool usage patterns
   */
  static verifyToolUsage(result: AgentResult, toolName: string, minCalls = 1): boolean {
    const calls = result.toolCalls.filter(c => c.tool === toolName);
    return calls.length >= minCalls;
  }

  /**
   * Utility to check for sensitive data leakage
   */
  static checkDataLeakage(result: AgentResult, sensitivePatterns: RegExp[]): string[] {
    const leaks: string[] = [];
    const fullText = result.output + JSON.stringify(result.toolCalls);
    
    for (const pattern of sensitivePatterns) {
      if (pattern.test(fullText)) {
        leaks.push(`Matched pattern: ${pattern.source}`);
      }
    }
    return leaks;
  }
}
