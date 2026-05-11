# agent-behavioral-sandbox

Isolated environment for testing and verifying AI agent behaviors before production deployment.

## Features

- **Sandboxed Execution:** Run agents with timeout protection and monitoring.
- **Behavioral Verification:** Define expected behaviors and verify them with score-based systems.
- **Custom Validators:** 
  - `RegexValidator`: Ensure output matches (or avoids) specific patterns.
  - `ToolValidator`: Verify the agent calls required tools and avoids forbidden ones.
  - `MetricValidator`: Enforce performance and cost constraints.
- **Detailed Reporting:** Automatically generate Markdown reports with execution traces, validation results, and tool calls.

## Installation

```bash
bun install
```

## Usage

### Basic Example

```typescript
import { BehavioralSandbox } from "./src/sandbox";
import { SandboxReporter } from "./src/reporter";
import { RegexValidator, ToolValidator } from "./src/validators";

const sandbox = new BehavioralSandbox({ maxDurationMs: 5000 });
const reporter = new SandboxReporter("./reports");

const scenario = {
  id: "search-task",
  name: "Search Verification",
  input: "Find info about X",
  validators: [
    new ToolValidator("Must use search", ["search"]),
    new RegexValidator("Must mention X", /X/i)
  ]
};

const report = await sandbox.runScenario(agent, scenario);
reporter.saveReport(report);
```

### Running the Example

```bash
bun src/index.ts test
```

## Architecture

- `src/types.ts`: Core data structures and interfaces.
- `src/sandbox.ts`: The main engine for executing agent scenarios.
- `src/validators.ts`: Pre-built validators for common verification tasks.
- `src/reporter.ts`: Markdown report generator.
- `src/index.ts`: CLI entrypoint.

## License

MIT
