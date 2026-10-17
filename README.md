# Cloud Security: Compliant-by-Pipeline Infrastructure

Real AWS infrastructure, written as code with Terraform and locked down with least-privilege IAM. Every push and pull request runs a GitHub Actions pipeline that checks the code and **fails the build** when something insecure sneaks in.

> **Status: all five scanning jobs are built and passing. A sixth job, `aws-auth` (proof that the pipeline can assume the AWS role via OIDC), is added but currently failing and under investigation. The deliberate-failure demo is next.** Nothing in this README claims more than what exists. Items marked _(planned)_ are not built yet.

## What this is

A small, deliberately minimal AWS setup:

- **A Lambda function** that reads one secret and returns `ok: true`. It never returns or logs the secret value.
- **A least-privilege IAM role** for that Lambda with exactly two permissions: write to its own log group, and `ssm:GetParameter` on that one parameter. No wildcards on allow statements.
- **CloudTrail** audit logging into a locked-down S3 bucket (public access blocked, versioning on, HTTPS-only, 90-day expiry, log file validation on).
- **A GitHub OIDC role** so a pipeline can get temporary AWS access with no long-lived keys stored in GitHub. It is created by Terraform. The `aws-auth` job tries to assume it, but that job is not passing yet (see Open issue).
- **A small dashboard app** (`app/`) that visualises the pipeline, findings and permissions. It runs in mock mode and also serves as the scan target for the SAST and SCA jobs.

The Lambda is intentionally tiny. It exists so the IAM policies have something real to protect. The point of the project is the security around it.

## What the pipeline does today

Runs on every push to `main` and every pull request. The five scanning jobs fail the build on findings.

| Job                  | What it checks                                                                              | Status                             |
| -------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------- |
| `terraform-validate` | `terraform fmt -check` (formatting) and `terraform validate` (syntax and references)        | Built, passing                     |
| `iac-scan`           | [Checkov](https://www.checkov.io/) scans the Terraform against AWS security benchmarks      | Built, passing                     |
| `secret-scan`        | gitleaks scans the full git history for committed secrets                                   | Built, passing                     |
| `sast`               | [Semgrep](https://semgrep.dev/) (`p/default` ruleset) scans the app and Lambda source       | Built, passing                     |
| `sca`                | [OSV-Scanner](https://google.github.io/osv-scanner/) checks npm dependencies for known CVEs | Built, passing                     |
| `aws-auth`           | Assumes the AWS OIDC role with no stored keys, then runs `aws sts get-caller-identity`      | Built, **failing** (investigating) |

`terraform apply` stays **manual** on purpose: the pipeline never changes the AWS account. Terraform state is local, so the pipeline does not run `plan` yet.

### What the app scanners covered

The dashboard in `app/` (React + Vite + TypeScript, mock mode) is the scan target for SAST and SCA.

| Job    | What it scanned                                        | Result                  |
| ------ | ------------------------------------------------------ | ----------------------- |
| `sast` | 16 git-tracked files in `app/src` and `src`, 213 rules | 0 findings              |
| `sca`  | 203 npm packages from `app/package-lock.json`          | 0 known vulnerabilities |

A clean result shows the checks ran, not that they catch anything. The deliberate-failure demo _(planned)_ will commit one insecure change per scanner and show each one failing the build.

Scope limits: SCA covers only the dashboard's lockfile (the Lambda has no dependencies), and Semgrep scans only files tracked by git.

## Architecture

```mermaid
flowchart LR
    dev["Push / pull request"] --> gha
    subgraph gha["GitHub Actions"]
        direction TB
        s1["terraform fmt + validate (built)"]
        s2["Checkov IaC scan (built)"]
        s3["gitleaks secret scan (built)"]
        s4["Semgrep SAST (built)"]
        s5["OSV-Scanner SCA (built)"]
        s6["aws-auth OIDC job (failing)"]
    end
    s6 -. "OIDC role exists; assuming it fails today (investigating)" .-> aws
    manual["terraform apply (manual)"] --> aws
    subgraph aws["AWS account"]
        direction TB
        fn["Lambda function"] -- "assumes" --> role["IAM role: least privilege"]
        role -- "GetParameter on one parameter only" --> ssm["SSM Parameter Store: one secret"]
        trail["CloudTrail"] --> bucket["S3 log bucket"]
    end
```

## Open issue: the pipeline cannot assume the AWS role yet

The `aws-auth` job fails at the `configure-aws-credentials` step with:

```
Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity
```

**Checked and correct**

- The role `p3-cloudsec-github-pipeline` exists.
- Its trust policy requires audience `sts.amazonaws.com` and allows only this repo's `main` branch and pull requests, and it matches the Terraform with no drift.
- The OIDC provider exists with `sts.amazonaws.com` in its client ID list.
- The job requests `id-token: write` at job level.

**Not yet confirmed**

- The values the job actually sends (the role ARN variable and the token's `sub` and `aud` claims). Two temporary debug steps in the job print them. Their output has not been reviewed yet.

The trust policy is deliberately not loosened to a repo-wide wildcard to make this pass. Least privilege is the point of the project. This section will be replaced with the root cause and fix once found.

## Evidence: the pipeline catching real findings

The first pull request ran the pipeline three times:

| Run | Result                                         | What happened                                                |
| --- | ---------------------------------------------- | ------------------------------------------------------------ |
| #1  | Failed: 16 Checkov findings (78 checks passed) | First scan of the Layer 1 code                               |
| #2  | Failed: 5 findings                             | After documenting 11 accepted skips in `.checkov.yaml`       |
| #3  | Passed                                         | After fixing 2 real findings and documenting 3 deferred ones |

<!-- Add a screenshot of the Actions run history as docs/pipeline-runs.png, then replace this comment with: ![Pipeline run history](docs/pipeline-runs.png) -->

### What the 16 findings were, and what I did

**Fixed in code (2)**

| Check         | What it was                                                      | Why it matters                                                   | Fix                                                    |
| ------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| `CKV_AWS_300` | The S3 lifecycle rule did not abort incomplete multipart uploads | Failed uploads sit in the bucket unseen and keep costing storage | Added `abort_incomplete_multipart_upload` after 7 days |
| `CKV_AWS_338` | Lambda log group kept logs only 14 days                          | Too short to investigate an incident found later                 | Retention raised to 365 days                           |

**Deferred, real gaps (3)**

| Check         | Gap                                                           | Plan                                               |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| `CKV_AWS_35`  | CloudTrail logs not encrypted with a customer-managed KMS key | One KMS key covering all three; needs key policies |
| `CKV_AWS_158` | Log group not encrypted with a customer-managed KMS key       | Same key                                           |
| `CKV_AWS_145` | S3 bucket uses default AES256, not a KMS key                  | Same key                                           |

These resources are already encrypted at rest with AWS-managed keys. A customer-managed key adds key-level access control and its own audit trail. Listed in `.checkov.yaml` as "deferred", not "not applicable".

**Accepted, with a reason (11)**: each is listed in `.checkov.yaml` with a comment.

| Check                                       | Why accepted                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| `CKV_AWS_117` Lambda in a VPC               | Needs NAT or endpoints, excluded for cost                                  |
| `CKV_AWS_50` X-Ray tracing                  | Needs a wildcard-resource permission, which conflicts with least privilege |
| `CKV_AWS_115` Reserved concurrency          | Can fail on new-account limits                                             |
| `CKV_AWS_272` Code signing                  | Out of scope for a demo function                                           |
| `CKV_AWS_116` Dead letter queue             | Applies to async invokes only; this function is invoked directly           |
| `CKV_AWS_173` Env var encryption            | The variable holds a parameter name, not a secret                          |
| `CKV_AWS_252` CloudTrail SNS topic          | No notification requirement                                                |
| `CKV2_AWS_10` CloudTrail to CloudWatch Logs | Extra cost, out of scope                                                   |
| `CKV2_AWS_62` S3 event notifications        | Not needed for a log bucket                                                |
| `CKV_AWS_144` Cross-region replication      | Cost, out of scope for a lab                                               |
| `CKV_AWS_18` S3 access logging              | Logging the log bucket creates a loop                                      |

## Repo layout

| File                             | Purpose                                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `providers.tf`                   | AWS and archive providers, pinned versions, region and account lookups                                               |
| `variables.tf`                   | Region, name prefix, secret parameter name                                                                           |
| `iam.tf`                         | The Lambda's role and policy, with a "why" comment on every permission                                               |
| `lambda.tf` + `src/index.mjs`    | The function, its log group, and its code                                                                            |
| `cloudtrail.tf`                  | Audit trail and its locked-down log bucket                                                                           |
| `github-oidc.tf`                 | OIDC provider and a read-only role GitHub Actions can assume, limited to this repo's `main` branch and pull requests |
| `outputs.tf`                     | Function name, role ARNs, log bucket name                                                                            |
| `app/`                           | Dashboard app used as the SAST and SCA scan target                                                                   |
| `.github/workflows/security.yml` | The pipeline                                                                                                         |
| `.checkov.yaml`                  | Accepted and deferred Checkov checks, each with a reason                                                             |

## Run it yourself

Needs Terraform 1.6 or newer, the AWS CLI, and an AWS account with credentials configured.

```bash
# 1. Create the secret OUTSIDE Terraform so its value never lands in state
aws ssm put-parameter --name /p3-cloudsec/demo-api-key --type SecureString \
  --value "not-a-real-secret" --region us-east-1

# 2. Build
terraform init
terraform validate
terraform plan
terraform apply

# 3. Test
aws lambda invoke --function-name p3-cloudsec-fn out.json && cat out.json

# 4. Tear down so nothing keeps costing money
terraform destroy
aws ssm delete-parameter --name /p3-cloudsec/demo-api-key --region us-east-1
```

On Windows with Git Bash, prefix any AWS CLI command that takes a `/`-leading value with `MSYS_NO_PATHCONV=1`. Otherwise Git Bash rewrites the path and AWS reports `ParameterNotFound`.

`terraform destroy` also removes the OIDC role. Re-running `terraform apply` recreates it. To use the `aws-auth` job, set the repository **variable** (not secret) `AWS_ROLE_ARN` to the role's ARN.

Never commit `terraform.tfstate`, `.terraform/`, or `*.tfvars`. The `.gitignore` already excludes them.

## What I've learned so far

- **The Terraform workflow:** `init` downloads plugins, `validate` checks the code, `plan` previews without changing anything, `apply` builds, `destroy` removes it all. Reading the plan before applying is the habit that matters.
- **Least privilege means being specific.** The Lambda role names two exact actions on two exact resources. A `Deny` with `s3:*` on the log bucket is fine, because it restricts access (HTTPS only) rather than granting it.
- **Keep secrets out of state.** If Terraform created the secret, its value would sit in the state file. The parameter is created separately and Terraform only knows its name.
- **State files are sensitive.** `terraform.tfstate` holds account details and resource IDs, so it must never reach Git.
- **CloudTrail proves what actually happened.** The event history shows the Lambda running as the assumed role and writing only to its own log group.
- **IAM is eventually consistent.** Terraform retried `CreateFunction` a few times until the new role propagated. The errors were noise, not a bug.
- **Valid is not secure.** `terraform validate` passes code that Checkov rejects, so the pipeline needs both.
- **Scanner rules target production.** Most of the 16 findings were sensible for a large system and overkill for a lab. The discipline is to fix the real ones and document every skip with a reason, not to switch the scanner off.
- **`known after apply` means "can't tell yet".** A plan line like that is not a change. The Lambda policy showed it, then applied as no change.
- **Pull requests leave a trail.** Changes go through a PR so the failing and passing runs stay on record.
- **A green scanner needs checking too.** I read the SAST and SCA logs to confirm they scanned real files and packages before trusting "0 findings". A scanner pointed at the wrong path passes silently.
- **One AWS error, many causes.** "Not authorized to perform sts:AssumeRoleWithWebIdentity" is the same message whether the trust policy, the OIDC provider, the role ARN or the token claims are wrong, so each has to be ruled out in turn.

## Known shortcuts (lab, not production)

- The deploying IAM user has `AdministratorAccess` to avoid permission friction while learning. A real setup would scope it down.
- The OIDC role uses the AWS-managed `ReadOnlyAccess` policy. It is broader than the pipeline needs (it can read the SSM secret), and the only job that uses it, `aws-auth`, is not passing yet.
- The log bucket uses `force_destroy = true` so `terraform destroy` works cleanly.
- Terraform state is local. A team setup would use a remote backend with locking, which would also let the pipeline run `plan`.
- Encryption uses AWS-managed keys. Customer-managed KMS keys are deferred (see above).
- Branch protection is not enforced, so a failing check does not yet block a merge. When enabled, it will require the five scanning jobs.
- The Semgrep container image is not pinned to a version. OSV-Scanner is pinned (v2.3.8).
