import React, { useState } from "react";
import { LambdaHealthState } from "../types/dashboard";
import { checkLambdaHealth, isMockModeConfigured } from "../utils/api";

export const LambdaHealth: React.FC = () => {
  const [health, setHealth] = useState<LambdaHealthState>({
    status: "idle",
    responseTimeMs: null,
    lastChecked: null,
    isMock: isMockModeConfigured(),
    errorMessage: null,
  });

  const handleCheck = async () => {
    setHealth((prev) => ({
      ...prev,
      status: "loading",
      errorMessage: null,
    }));

    const result = await checkLambdaHealth();

    const timestamp = new Date().toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    if (result.ok) {
      setHealth({
        status: "ok",
        responseTimeMs: result.responseTimeMs,
        lastChecked: timestamp,
        isMock: result.isMock,
        errorMessage: null,
      });
    } else {
      setHealth({
        status: "error",
        responseTimeMs: result.responseTimeMs,
        lastChecked: timestamp,
        isMock: result.isMock,
        errorMessage: result.error || "Health check failed.",
      });
    }
  };

  const getStatusBadge = () => {
    switch (health.status) {
      case "loading":
        return (
          <span className="status-badge loading">
            <span className="spinner" aria-hidden="true" />
            <span>Checking...</span>
          </span>
        );
      case "ok":
        return (
          <span className="status-badge ok">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Healthy (OK)</span>
          </span>
        );
      case "error":
        return (
          <span className="status-badge error">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>Unhealthy (Error)</span>
          </span>
        );
      case "idle":
      default:
        return (
          <span className="status-badge idle">
            <span>Standby</span>
          </span>
        );
    }
  };

  return (
    <section className="dash-card" aria-labelledby="lambda-health-heading">
      <div className="card-header">
        <div className="card-title-group">
          <h2 id="lambda-health-heading" className="card-title">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span>Lambda Health</span>
          </h2>
          <p className="card-desc">Runtime execution status and secret resolution probe</p>
        </div>

        {health.isMock && (
          <span className="badge-mock-mode" title="Operating with synthetic simulated response">
            Mock mode
          </span>
        )}
      </div>

      <div className="health-status-row">
        <div className="health-status-indicator">
          {getStatusBadge()}
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={handleCheck}
          disabled={health.status === "loading"}
          aria-label="Execute Lambda health check probe"
        >
          {health.status === "loading" ? (
            <>
              <span className="spinner" aria-hidden="true" />
              <span>Probing...</span>
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Check Health</span>
            </>
          )}
        </button>
      </div>

      <div className="health-metrics-grid">
        <div className="health-metric-box">
          <span className="health-metric-label">Response Time</span>
          <span className="health-metric-val">
            {health.responseTimeMs !== null ? `${health.responseTimeMs} ms` : "—"}
          </span>
        </div>

        <div className="health-metric-box">
          <span className="health-metric-label">Last Checked</span>
          <span className="health-metric-val">
            {health.lastChecked ?? "Not checked yet"}
          </span>
        </div>
      </div>

      {health.errorMessage && (
        <div className="error-banner" role="alert">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{health.errorMessage}</span>
        </div>
      )}
    </section>
  );
};
