import React, { useState } from "react";
import findingsData from "../data/findings.json";
import { FindingsData, FindingStatus } from "../types/dashboard";

export const FindingsCard: React.FC = () => {
  const data = findingsData as FindingsData;
  const [selectedStatus, setSelectedStatus] = useState<FindingStatus | null>(null);

  const total = data.summary.total;
  const fixedCount = data.summary.fixed;
  const deferredCount = data.summary.deferred;
  const acceptedCount = data.summary.accepted;

  // SVG Donut geometry
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.761

  const fixedLength = (fixedCount / total) * circumference;
  const deferredLength = (deferredCount / total) * circumference;
  const acceptedLength = (acceptedCount / total) * circumference;

  const fixedOffset = 0;
  const deferredOffset = -fixedLength;
  const acceptedOffset = -(fixedLength + deferredLength);

  const fixedPct = ((fixedCount / total) * 100).toFixed(1);
  const deferredPct = ((deferredCount / total) * 100).toFixed(1);
  const acceptedPct = ((acceptedCount / total) * 100).toFixed(1);

  const filteredItems = selectedStatus
    ? data.items.filter((item) => item.status === selectedStatus)
    : data.items;

  return (
    <section className="dash-card" aria-labelledby="findings-heading">
      <div className="card-header">
        <div className="card-title-group">
          <h2 id="findings-heading" className="card-title">
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
              <circle cx="12" cy="12" r="10" />
              <path d="m4.93 4.93 4.24 4.24" />
              <path d="m14.83 9.17 4.24-4.24" />
              <path d="m14.83 14.83 4.24 4.24" />
              <path d="m9.17 14.83-4.24 4.24" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            <span>Checkov Findings Posture</span>
          </h2>
          <p className="card-desc">16 audited security findings evaluated across Terraform resources</p>
        </div>
      </div>

      <div className="findings-layout">
        {/* Inline SVG Donut Chart */}
        <div className="chart-visual-wrapper">
          <svg
            className="donut-svg"
            viewBox="0 0 100 100"
            role="img"
            aria-labelledby="findings-chart-title findings-chart-desc"
          >
            <title id="findings-chart-title">Checkov Findings Distribution Donut Chart</title>
            <desc id="findings-chart-desc">
              Chart showing 16 Checkov findings: 2 fixed (12.5%), 3 deferred (18.8%), and 11 accepted (68.8%).
            </desc>

            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="var(--border-subtle)"
              strokeWidth="18"
            />

            {/* Fixed Segment */}
            <circle
              className={`donut-segment ${selectedStatus === "fixed" ? "selected" : ""}`}
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="var(--status-ok)"
              strokeWidth="18"
              strokeDasharray={`${fixedLength} ${circumference - fixedLength}`}
              strokeDashoffset={fixedOffset}
              onClick={() => setSelectedStatus(selectedStatus === "fixed" ? null : "fixed")}
              aria-label={`Fixed: ${fixedCount} findings (${fixedPct}%)`}
            />

            {/* Deferred Segment */}
            <circle
              className={`donut-segment ${selectedStatus === "deferred" ? "selected" : ""}`}
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="var(--status-warn)"
              strokeWidth="18"
              strokeDasharray={`${deferredLength} ${circumference - deferredLength}`}
              strokeDashoffset={deferredOffset}
              onClick={() => setSelectedStatus(selectedStatus === "deferred" ? null : "deferred")}
              aria-label={`Deferred: ${deferredCount} findings (${deferredPct}%)`}
            />

            {/* Accepted Segment */}
            <circle
              className={`donut-segment ${selectedStatus === "accepted" ? "selected" : ""}`}
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="var(--status-planned)"
              strokeWidth="18"
              strokeDasharray={`${acceptedLength} ${circumference - acceptedLength}`}
              strokeDashoffset={acceptedOffset}
              onClick={() => setSelectedStatus(selectedStatus === "accepted" ? null : "accepted")}
              aria-label={`Accepted: ${acceptedCount} findings (${acceptedPct}%)`}
            />
          </svg>

          {/* Donut Center Label */}
          <div className="donut-center-info" aria-hidden="true">
            <span className="donut-center-count">
              {selectedStatus === "fixed"
                ? fixedCount
                : selectedStatus === "deferred"
                ? deferredCount
                : selectedStatus === "accepted"
                ? acceptedCount
                : total}
            </span>
            <span className="donut-center-label">
              {selectedStatus ? selectedStatus : "Findings"}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="findings-legend" role="list">
          <button
            type="button"
            className={`legend-item-btn ${selectedStatus === "fixed" ? "active" : ""}`}
            onClick={() => setSelectedStatus(selectedStatus === "fixed" ? null : "fixed")}
            aria-pressed={selectedStatus === "fixed"}
          >
            <div className="legend-item-left">
              <span
                className="legend-swatch swatch-fixed"
                aria-hidden="true"
              />
              <span className="legend-label">Fixed</span>
            </div>
            <div className="legend-item-right">
              <span className="legend-count">{fixedCount}</span>
              <span className="legend-pct">({fixedPct}%)</span>
            </div>
          </button>

          <button
            type="button"
            className={`legend-item-btn ${selectedStatus === "deferred" ? "active" : ""}`}
            onClick={() => setSelectedStatus(selectedStatus === "deferred" ? null : "deferred")}
            aria-pressed={selectedStatus === "deferred"}
          >
            <div className="legend-item-left">
              <span
                className="legend-swatch swatch-deferred"
                aria-hidden="true"
              />
              <span className="legend-label">Deferred</span>
            </div>
            <div className="legend-item-right">
              <span className="legend-count">{deferredCount}</span>
              <span className="legend-pct">({deferredPct}%)</span>
            </div>
          </button>

          <button
            type="button"
            className={`legend-item-btn ${selectedStatus === "accepted" ? "active" : ""}`}
            onClick={() => setSelectedStatus(selectedStatus === "accepted" ? null : "accepted")}
            aria-pressed={selectedStatus === "accepted"}
          >
            <div className="legend-item-left">
              <span
                className="legend-swatch swatch-accepted"
                aria-hidden="true"
              />
              <span className="legend-label">Accepted</span>
            </div>
            <div className="legend-item-right">
              <span className="legend-count">{acceptedCount}</span>
              <span className="legend-pct">({acceptedPct}%)</span>
            </div>
          </button>
        </div>
      </div>

      {/* Details breakdown */}
      <div className="findings-details-drawer">
        <div className="drawer-header">
          <span>
            {selectedStatus
              ? `${selectedStatus.toUpperCase()} FINDINGS (${filteredItems.length})`
              : `ALL AUDITED FINDINGS (${filteredItems.length})`}
          </span>
          {selectedStatus && (
            <button
              type="button"
              className="btn-copy"
              onClick={() => setSelectedStatus(null)}
              aria-label="Clear findings filter"
            >
              Reset filter
            </button>
          )}
        </div>

        <div className="findings-scroll-list" role="list">
          {filteredItems.map((item) => (
            <div key={item.id} className="finding-row" role="listitem">
              <span className="finding-code">{item.id}</span>
              <span className="finding-text">
                <strong>{item.title}:</strong> {item.rationale}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
