import { describe, test, expect } from "bun:test";
describe("agent-behavioral-sandbox", () => {
  test("module loads", async () => { const m = await import("./index"); expect(m).toBeDefined(); });
});
