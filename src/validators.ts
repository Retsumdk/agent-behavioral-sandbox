import { Validator, AgentResult } from "./types";

export class RegexValidator implements Validator {
  constructor(
    public name: string,
    private pattern: RegExp,
    private shouldMatch: boolean = true
  ) {}

  async validate(result: AgentResult) {
    const matches = this.pattern.test(result.output);
    const passed = this.shouldMatch ? matches : !matches;
    return {
      passed,
      message: passed 
        ? undefined 
        : `Regex validation failed: Output ${this.shouldMatch ? "did not match" : "matched"} pattern /${this.pattern.source}/`,
    };
  }
}

export class ToolValidator implements Validator {
  constructor(
    public name: string,
    private requiredTools: string[],
    private forbiddenTools: string[] = []
  ) {}

  async validate(result: AgentResult) {
    const usedTools = new Set(result.toolCalls.map(c => c.tool));
    const missing = this.requiredTools.filter(t => !usedTools.has(t));
    const forbidden = this.forbiddenTools.filter(t => usedTools.has(t));

    if (missing.length > 0) {
      return { passed: false, message: `Missing required tool calls: ${missing.join(", ")}` };
    }
    if (forbidden.length > 0) {
      return { passed: false, message: `Used forbidden tool calls: ${forbidden.join(", ")}` };
    }

    return { passed: true };
  }
}

export class MetricValidator implements Validator {
  constructor(
    public name: string,
    private maxDurationMs?: number,
    private maxCost?: number
  ) {}

  async validate(result: AgentResult) {
    if (this.maxDurationMs && result.metrics.durationMs > this.maxDurationMs) {
      return { 
        passed: false, 
        message: `Duration exceeded limit: ${result.metrics.durationMs}ms > ${this.maxDurationMs}ms` 
      };
    }
    if (this.maxCost && result.metrics.cost && result.metrics.cost > this.maxCost) {
      return { 
        passed: false, 
        message: `Cost exceeded budget: $${result.metrics.cost} > $${this.maxCost}` 
      };
    }
    return { passed: true };
  }
}
