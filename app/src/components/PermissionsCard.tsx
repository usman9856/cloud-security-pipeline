import React, { useState } from "react";
import permissionsData from "../data/permissions.json";
import { PermissionPolicy } from "../types/dashboard";

export const PermissionsCard: React.FC = () => {
  const permissions = permissionsData as PermissionPolicy[];
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyResource = (id: string, resource: string) => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(resource);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      // Clipboard write failure handled gracefully
    }
  };

  return (
    <section className="dash-card" aria-labelledby="permissions-heading">
      <div className="card-header">
        <div className="card-title-group">
          <h2 id="permissions-heading" className="card-title">
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
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Least-Privilege Permissions</span>
          </h2>
          <p className="card-desc">Explicit AWS IAM execution boundaries granted to the Lambda role</p>
        </div>
      </div>

      <div className="permissions-list" role="list">
        {permissions.map((perm) => (
          <div key={perm.id} className="permission-item" role="listitem">
            <div className="permission-header">
              <span className="permission-title">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 8 8 12 12 16" />
                  <line x1="16" y1="12" x2="8" y2="12" />
                </svg>
                <span>{perm.title}</span>
              </span>
              <span className="permission-sid">{perm.sid}</span>
            </div>

            <div className="permission-actions" aria-label="Granted actions">
              {perm.actions.map((act) => (
                <span key={act} className="action-pill">
                  {act}
                </span>
              ))}
            </div>

            <div className="permission-resource-box">
              <span className="resource-arn" title={perm.resource}>
                {perm.resource}
              </span>
              <button
                type="button"
                className="btn-copy"
                onClick={() => handleCopyResource(perm.id, perm.resource)}
                aria-label={`Copy ARN for ${perm.title}`}
                title="Copy ARN to clipboard"
              >
                {copiedId === perm.id ? (
                  <>
                    <svg
                      width="12"
                      height="12"
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
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <p className="permission-why">
              <strong>Rationale:</strong> {perm.why}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
