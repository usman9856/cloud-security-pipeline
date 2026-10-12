# Cloud Security Status Dashboard

A minimalist, high-performance security posture dashboard built for the `cloud-security-pipeline` repository. It provides visibility into cloud resource health, automated CI/CD security quality gates, IAM least-privilege boundary policies, and infrastructure-as-code (IaC) Checkov findings.

Designed as a hardened baseline with zero external runtime CDNs, strict Content Security Policy (CSP), minimal pinned dependencies, and clean architecture ready for automated SAST (Semgrep) and SCA (Trivy/OSV) CI scans.

---

## Tech Stack & Architecture

- **Runtime & Framework**: React 18 + TypeScript + Vite.
- **Styling**: Plain Vanilla CSS with CSS Custom Properties (zero CSS frameworks, modern Linear/Vercel-inspired developer dark and light themes).
- **Visualizations**: Pure inline SVG vector graphics (accessible donut chart, status icons, pulse indicators) without heavy third-party charting libraries.
- **Dependencies**: Minimal pinned dependency footprint (`react`, `react-dom`, `vite`, `typescript`, `@vitejs/plugin-react`, `eslint`).

---

## What It Shows

1. **Dashboard Header & Theme Toggle**:
   - Shows active posture status indicator.
   - Light/Dark theme toggle with user preference safely persisted in browser `localStorage` (wrapped in `try/catch` to guarantee resilience in restricted storage environments).

2. **Lambda Health Card**:
   - **Check Health Button**: Probes the Lambda execution endpoint.
   - **Latency Tracking**: Measures roundtrip response duration in milliseconds (`ms`).
   - **Timestamp**: Records last-checked execution time.
   - **Error Handling**: 5-second timeout enforced via `AbortController`. Strictly sanitizes error messages and never leaks raw server traces or unvalidated input.
   - **Mock Mode Badge**: Displays a purple pill tag when operating without an active cloud endpoint.

3. **Pipeline Checks Card**:
   - Tracks 5 pipeline gates derived from `.github/workflows/security.yml` and project roadmap:
     - `terraform-validate` (**Built**): HCL format and syntax checks.
     - `iac-scan` (**Built**): Checkov static analysis for Terraform.
     - `secret-scan` (**Built**): Gitleaks deep Git history scanning.
     - `SAST` (**Planned**): Semgrep static application security testing for runtime handlers.
     - `SCA` (**Planned**): Trivy / OSV software composition analysis for dependencies.

4. **Least-Privilege Permissions Card**:
   - Explicitly documents the two IAM permissions granted to `aws_iam_role.lambda_exec` in `iam.tf`:
     - **Write Execution Logs** (`WriteOwnLogs`): Scoped strictly to `${aws_cloudwatch_log_group.lambda.arn}:*`. `logs:CreateLogGroup` is not granted (denied by default) and avoids wildcards (`logs:* on *`).
     - **Read SSM Secret Parameter** (`ReadOneParameter`): Scoped strictly to the specific parameter ARN `arn:aws:ssm:...:parameter${var.secret_param_name}` with `ssm:GetParameter` only.
   - Interactive one-click ARN copying with feedback.

5. **Checkov Findings Posture Card**:
   - Accessible inline SVG Donut Chart illustrating 16 total audited findings:
     - **Fixed (2)**: 12.5% (`CKV_AWS_300` S3 multipart upload abort rule, `CKV_AWS_338` Log group retention 365 days).
     - **Deferred (3)**: 18.8% (Customer-managed KMS keys planned: `CKV_AWS_35`, `CKV_AWS_158`, `CKV_AWS_145`).
     - **Accepted (11)**: 68.8% (Architectural trade-offs cataloged in `.checkov.yaml`).
   - Interactive legend with filterable finding breakdown drawer and full screen-reader accessibility (`role="img"`, ARIA labels, `<title>`, `<desc>`).

---

## Quickstart & Local Execution

### 1. Install Dependencies
```bash
cd app
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser. The app runs immediately in **Mock Mode** by default.

### 3. Build for Production
```bash
npm run build
```

### 4. Preview Production Build
```bash
npm run preview
```

### 5. Lint
```bash
npm run lint
```

---

## Mock Mode vs. Real API Mode

### How Mock Mode Works
When `VITE_API_URL` is empty or omitted:
1. The app automatically detects that no remote endpoint is configured.
2. A visible **"Mock mode"** pill badge appears on the Lambda Health card.
3. Clicking **Check Health** triggers a simulated network latency delay (120ms – 240ms) and resolves with `{ ok: true }`, mirroring the real Lambda handler payload (`src/index.mjs`).
4. Allows immediate offline testing, demonstration, and CI verification without requiring AWS credentials or live infrastructure.

### Pointing to a Real Endpoint
To point the dashboard to an actual deployed AWS Lambda Function URL or API Gateway endpoint:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set your deployed API endpoint URL in `.env`:
   ```env
   VITE_API_URL=https://<your-lambda-function-url-or-api-gateway>.amazonaws.com/health
   ```
3. Restart or start the Vite server:
   ```bash
   npm run dev
   ```

### Real API Security & Validation Rules
- **Timeout**: Enforces a strict 5-second deadline with `AbortController`.
- **Response Validation**: Enforces that the response is valid JSON matching either `{ ok: boolean }` or AWS Lambda proxy format `{ statusCode: 200, body: '{"ok": true}' }`.
- **Information Protection**: Server error status codes or stack traces are never rendered to the DOM. Only friendly, sanitized state labels are displayed.

---

## Security Hardening Baseline

- **Content-Security-Policy (CSP)**: Strictly scoped via `index.html` and `vite.config.ts`. Removes broad protocols (`http:`, `https:`, `ws:`) from `connect-src`, using `'self'` plus the exact origin of `VITE_API_URL` when configured. Vite dev HMR allows `ws://localhost:*` only in dev mode. Removes `'unsafe-inline'` from `style-src` in production builds.
  ```html
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';" />
  ```
- **Zero Inline Code Injections**: No `dangerouslySetInnerHTML`, `eval`, `new Function`, `innerHTML`, or inline style attributes anywhere in the codebase.
- **Zero Hardcoded Secrets**: Secrets and endpoints are read exclusively from environment variables. Local `.env*` files are ignored in `.gitignore`.
- **Pinned Dependencies**: Exact versions in `package.json` with a committed `package-lock.json` to prevent dependency tampering during SCA scans.
