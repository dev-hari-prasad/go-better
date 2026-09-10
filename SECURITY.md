# Security Policy

The GoBetter team and community take the security and integrity of our codebase, webhook ingestion pipelines, and user data seriously. We appreciate responsible disclosures of security vulnerabilities.

---

## Supported Versions

Security fixes and patches are applied to the latest `main` branch.

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |
| `< 1.0` | :white_check_mark: |

---

## Reporting a Vulnerability

If you discover a security vulnerability, flaw, or potential exploit in GoBetter (including the API server, webhook handlers, worker queues, AES-256 BYOK encryption vault, or client application), **please do not report it in a public GitHub issue, discussion, or pull request.**

Instead, please send a private disclosure email directly to:

📧 **`harii.codess@gmail.com`**

### What to Include in Your Report

To help us triage and resolve the issue quickly, please include:
1. **Description**: A clear description of the vulnerability and its potential security impact.
2. **Affected Component**: The specific package, endpoint, worker, or service affected (e.g., `/webhook`, `agenticReview.worker.ts`, `BYOK encryption`).
3. **Reproduction Steps**: Step-by-step instructions, curl commands, sample payloads, or proof-of-concept (PoC) code to reproduce the behavior.
4. **Environment**: Any specific environment configurations or dependencies involved.
5. **Mitigation**: Any proposed patch, fix, or mitigation steps if you have already formulated one.

---

## Our Response Process

1. **Acknowledgment**: We aim to acknowledge receipt of your vulnerability report within **48 hours**.
2. **Assessment**: We will investigate, verify the vulnerability, and assess the severity and impact.
3. **Remediation**: A fix will be developed, reviewed, and tested in a private branch.
4. **Disclosure & Attribution**: Once the fix is merged and released, we will credit your responsible disclosure (unless you prefer to remain anonymous).

---

## Safe Harbor & Research Guidelines

We consider security research conducted in good faith to be authorized and protected under safe harbor guidelines provided you:
- Make a good-faith effort to avoid privacy violations, data loss, and denial of service.
- Do not access, modify, or destroy user data belonging to other accounts without explicit permission.
- Give us reasonable time to remediate the issue before making any public disclosure.

Thank you for helping keep GoBetter and our open-source community safe!
