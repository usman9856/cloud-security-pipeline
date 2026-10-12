import React from "react";
import pipelineData from "../data/pipeline.json";
import { PipelineJob } from "../types/dashboard";

export const PipelineCard: React.FC = () => {
  const jobs = pipelineData as PipelineJob[];

  return (
    <section className="dash-card" aria-labelledby="pipeline-checks-heading">
      <div className="card-header">
        <div className="card-title-group">
          <h2 id="pipeline-checks-heading" className="card-title">
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
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span>Pipeline Checks</span>
          </h2>
          <p className="card-desc">CI/CD automated security gates and upcoming enforcement stages</p>
        </div>
      </div>

      <div className="pipeline-list" role="list">
        {jobs.map((job) => (
          <div key={job.id} className="pipeline-item" role="listitem">
            <div className="pipeline-item-top">
              <span className="pipeline-item-title">
                {job.status === "built" ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--status-ok)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--status-planned)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                )}
                <span>{job.name}</span>
              </span>

              {job.status === "built" ? (
                <span className="status-pill-built">Built</span>
              ) : (
                <span className="status-pill-planned">Planned</span>
              )}
            </div>

            <div className="pipeline-item-meta">
              <span className="pipeline-item-tool">{job.tool}</span>
              <span aria-hidden="true">•</span>
              <span>{job.category}</span>
            </div>

            <p className="pipeline-item-desc">{job.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
