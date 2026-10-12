export type HealthStatus = "idle" | "loading" | "ok" | "error";

export interface LambdaHealthState {
  status: HealthStatus;
  responseTimeMs: number | null;
  lastChecked: string | null;
  isMock: boolean;
  errorMessage: string | null;
}

export type JobStatus = "built" | "planned";

export interface PipelineJob {
  id: string;
  name: string;
  status: JobStatus;
  tool: string;
  category: string;
  description: string;
}

export interface PermissionPolicy {
  id: string;
  title: string;
  sid: string;
  actions: string[];
  resource: string;
  why: string;
}

export type FindingStatus = "fixed" | "deferred" | "accepted";

export interface FindingItem {
  id: string;
  status: FindingStatus;
  title: string;
  rationale: string;
}

export interface FindingsData {
  summary: {
    fixed: number;
    deferred: number;
    accepted: number;
    total: number;
  };
  items: FindingItem[];
}
