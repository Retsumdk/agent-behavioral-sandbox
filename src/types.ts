export interface Agent {
  name: string;
  run: (input: string) => Promise<AgentResult>;
}

export interface AgentResult {
  output: string;
  toolCalls: ToolCall[];
  metrics: AgentMetrics;
}

export interface ToolCall {
  tool: string;
  args: any;
  response: any;
  timestamp: number;
}

export interface AgentMetrics {
  startTime: number;
  endTime: number;
  durationMs: number;
  tokensUsed?: number;
  cost?: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  input: string;
  expectedBehavior?: (result: AgentResult) => BehaviorVerification;
  validators?: Validator[];
}

export interface BehaviorVerification {
  passed: boolean;
  score: number; // 0-100
  reason?: string;
  findings: string[];
}

export interface Validator {
  name: string;
  validate: (result: AgentResult) => Promise<{ passed: boolean; message?: string }>;
}

export interface SandboxConfig {
  maxDurationMs: number;
  allowedTools: string[];
  mockResponses: Record<string, any>;
  interceptNetwork: boolean;
}

export interface SandboxReport {
  scenarioId: string;
  timestamp: number;
  result: AgentResult;
  verification: BehaviorVerification;
  validationResults: { name: string; passed: boolean; message?: string }[];
}
