# Claude ZAI Code Review Workflow

This workflow provides automated code review for pull requests using the Z.AI Claude API.

## Overview

The `claude-zai-review.yml` workflow:

- **Auto-runs on every PR** - Automatically reviews code when a PR is opened, updated (`synchronize`), or reopened
- **Manual trigger via `@zai-claude`** - Mention `@zai-claude` in any PR comment to trigger a review on demand
- **Posts reviews as comments** - Results are posted directly to the PR as markdown comments

## Required Secrets

Configure these secrets in your GitHub repository:

### Secret Configuration Steps

1. Go to **Repository Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** for each secret below

| Secret Name | Description | Example Value |
| ------------ | ----------- | ------------- |
| `ZAI_API_KEY` | Your Z.AI API key for Claude access | `sk-ant-...` or similar |
| `ZAI_API_URL` | The Z.AI API base URL (Anthropic-compatible) | `https://api.z.ai` or `https://api.z.ai/api/anthropic` |

### Finding Your Z.AI Credentials

- Contact your Z.AI administrator or check the Z.AI dashboard for your API key
- The API URL should be provided by Z.AI - it must be Anthropic API-compatible (hosting `/v1/messages` endpoint)

## Usage

### Automatic Review

Code reviews run automatically when:
- A PR is **opened**
- A PR is **updated** (new commits pushed)
- A PR is **reopened**

### Manual Trigger

To trigger a review on demand, add a comment with:

```
@zai-claude please review this PR
```

Or simply:

```
@zai-claude
```

## Dual Claude Setup: `@claude` vs `@zai-claude`

This repository supports **both** Claude instances:

| Trigger | Workflow | API | Use Case |
| ------- | -------- | --- | -------- |
| `@claude` | `claude.yml` | Official Anthropic API | General tasks, implementation |
| `@zai-claude` | `claude-zai-review.yml` | Z.AI API | Automated code review |

### How It Works

Both workflows coexist independently:

1. **`@claude`** - Existing workflow using `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` for general assistance
2. **`@zai-claude`** - New workflow using `ZAI_API_KEY` and `ZAI_API_URL` for code review

The different trigger phrases (`@claude` vs `@zai-claude`) allow you to choose which instance to use.

## Workflow Files

| File | Triggers | API | Notes |
| ---- | -------- | --- | ----- |
| `.github/workflows/claude.yml` | `@claude` mentions | Anthropic official | General purpose |
| `.github/workflows/claude-zai-review.yml` | PR events + `@zai-claude` | Z.AI | Code review focused |

## Review Criteria

The ZAI reviewer focuses on:

1. **Code quality** - Readability, maintainability, patterns
2. **Potential bugs** - Edge cases, error handling, validation
3. **Performance** - Efficiency, resource usage
4. **Security** - OWASP top 10, secrets, injection risks
5. **Guidelines compliance** - Adherence to `CLAUDE.md` standards

## Permissions

The workflow requires:
- `contents: read` - To read repository files
- `pull-requests: write` - To post review comments
- `issues: read` - To access PR context

## Troubleshooting

### Review not posting

1. Check **Actions** tab for workflow runs
2. Verify secrets are correctly set (case-sensitive: `ZAI_API_KEY`, `ZAI_API_URL`)
3. Ensure Z.AI API URL is accessible and Anthropic-compatible

### Authentication errors

- Verify `ZAI_API_KEY` is valid and active
- Confirm `ZAI_API_URL` is correct for your Z.AI environment
- Check Z.AI dashboard for any service outages

### Both @claude and @zai-claude triggering

If you mention both in a comment, both workflows may run. Use distinct trigger phrases to control which reviewer responds.

## Cost Considerations

- Each PR review consumes API tokens based on codebase size and review depth
- Reviews run on `synchronize` events - consider using draft PRs for WIP changes
- The `max_turns: 10` limit prevents excessive token usage

## References

- [Claude Code Base Action](https://github.com/anthropics/claude-code-base-action)
- [Claude Code GitHub Actions Docs](https://code.claude.com/docs/en/github-actions)
- [Custom API Endpoints (Issue #216)](https://github.com/anthropics/claude-code/issues/216)
