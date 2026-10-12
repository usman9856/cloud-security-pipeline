import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { LambdaHealth } from "./components/LambdaHealth";
import { PipelineCard } from "./components/PipelineCard";
import { PermissionsCard } from "./components/PermissionsCard";
import { FindingsCard } from "./components/FindingsCard";
import { getInitialTheme, applyTheme, Theme } from "./utils/theme";

export const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const handleToggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <div className="app-container">
      <Header theme={theme} onToggleTheme={handleToggleTheme} />

      {/* Posture KPI Summary Banner */}
      <section className="metrics-summary-bar" aria-label="Security Posture Summary">
        <div className="metric-pill-card">
          <span className="metric-pill-label">Pipeline Active</span>
          <span className="metric-pill-value">
            3 <span className="metric-pill-meta">/ 5 gates</span>
          </span>
        </div>

        <div className="metric-pill-card">
          <span className="metric-pill-label">Pipeline Planned</span>
          <span className="metric-pill-value">
            2 <span className="metric-pill-meta">SAST & SCA</span>
          </span>
        </div>

        <div className="metric-pill-card">
          <span className="metric-pill-label">IAM Boundaries</span>
          <span className="metric-pill-value">
            2 <span className="metric-pill-meta">explicit grants</span>
          </span>
        </div>

        <div className="metric-pill-card">
          <span className="metric-pill-label">Checkov Audited</span>
          <span className="metric-pill-value">
            16 <span className="metric-pill-meta">findings cataloged</span>
          </span>
        </div>
      </section>

      {/* Main Cards Bento Grid */}
      <main className="dashboard-grid">
        <LambdaHealth />
        <PipelineCard />
        <PermissionsCard />
        <FindingsCard />
      </main>

      {/* Security & Verification Footer */}
      <footer className="dashboard-footer" role="contentinfo">
        <p>
          Cloud Security Status Console • Hardened single-page baseline with zero CDN dependencies.
        </p>
        <div className="footer-badges">
          <span className="footer-badge">CSP: Strict</span>
          <span className="footer-badge">SAST: Ready</span>
          <span className="footer-badge">SCA: Pinned</span>
          <span className="footer-badge">Zero Secrets</span>
        </div>
      </footer>
    </div>
  );
};
