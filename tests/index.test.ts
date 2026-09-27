import { describe, test, expect } from "bun:test";
import { RegexValidator, ToolValidator, MetricValidator } from "../src/validators";
import type { AgentResult } from "../src/types";

function result(overrides: Partial<AgentResult> = {}): AgentResult {
  return {
    output: "Task completed successfully",
    toolCalls: [],
    metrics: { startTime: 0, endTime: 10, durationMs: 10 },
    ...overrides,
  };
}

describe("RegexValidator", () => {
  test("passes when output matches the expected pattern", async () => {
    const validator = new RegexValidator("mentions success", /success/i, true);
    const verdict = await validator.validate(result());
    expect(verdict.passed).toBe(true);
  });

  test("fails when output should match but does not", async () => {
    const validator = new RegexValidator("mentions failure", /error/i, true);
    const verdict = await validator.validate(result());
    expect(verdict.passed).toBe(false);
    expect(verdict.message).toContain("did not match");
  });

  test("supports inverted matching", async () => {
    const validator = new RegexValidator("no stack traces", /stack trace/i, false);
    const verdict = await validator.validate(result());
    expect(verdict.passed).toBe(true);
  });
});

describe("ToolValidator", () => {
  test("requires the declared tool calls", async () => {
    const validator = new ToolValidator("uses reader", ["read_file"]);
    const verdict = await validator.validate(
      result({ toolCalls: [{ tool: "read_file", args: {}, response: "ok", timestamp: 0 }] })
    );
    expect(verdict.passed).toBe(true);
  });

  test("fails when a required tool was never called", async () => {
    const validator = new ToolValidator("uses writer", ["write_file"]);
    const verdict = await validator.validate(result());
    expect(verdict.passed).toBe(false);
    expect(verdict.message).toContain("Missing required tool calls");
  });

  test("fails when a forbidden tool was called", async () => {
    const validator = new ToolValidator("safe agent", [], ["run_bash_command"]);
    const verdict = await validator.validate(
      result({ toolCalls: [{ tool: "run_bash_command", args: {}, response: "ok", timestamp: 0 }] })
    );
    expect(verdict.passed).toBe(false);
    expect(verdict.message).toContain("forbidden");
  });
});

describe("MetricValidator", () => {
  test("enforces the duration ceiling", async () => {
    const validator = new MetricValidator("fast enough", 1000);
    const verdict = await validator.validate(result());
    expect(verdict.passed).toBe(true);
  });

  test("fails when the agent exceeds the duration ceiling", async () => {
    const validator = new MetricValidator("too slow", 5);
    const verdict = await validator.validate(result());
    expect(verdict.passed).toBe(false);
  });
});
