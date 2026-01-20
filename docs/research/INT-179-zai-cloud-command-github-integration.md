# INT-179: Z.ai Cloud Command Integration on GitHub

## Research Summary

This document investigates how to use Z.ai API keys with Claude Code GitHub Actions instead of direct Anthropic API.

## Background

### What is Z.ai?

Z.ai is a third-party API provider (operated by Zhipu AI) that offers Claude Code compatibility through their GLM-4.7 models. It provides:

- Higher token usage quotas compared to direct Anthropic API
- Access to GLM-4.7 and GLM-4.5-Air models
- An Anthropic API-compatible endpoint at `https://api.z.ai/api/anthropic`

### Current GitHub Integration Options

The official [Claude Code GitHub Action](https://github.com/anthropics/claude-code-action) supports:

1. **Direct Anthropic API** - Uses `anthropic_api_key` secret
2. **Amazon Bedrock** - Uses OIDC authentication
3. **Google Vertex AI** - Uses OIDC authentication
4. **Microsoft Foundry** - Uses OIDC authentication + custom base URL

## Solution: Using Z.ai with GitHub Actions

The Claude Code GitHub Action supports custom API endpoints through environment variables:

| Variable                | Description                    |
| ----------------------- | ------------------------------ |
| `ANTHROPIC_BASE_URL`    | Custom Anthropic API endpoint  |
| `ANTHROPIC_CUSTOM_HEADERS` | Additional request headers  |

### Configuration Method

To use Z.ai with Claude Code GitHub Action:

#### Step 1: Store Z.ai API Key as GitHub Secret

1. Go to repository Settings > Secrets and variables > Actions
2. Create a new secret: `ZAI_API_KEY` with your Z.ai API key

#### Step 2: Configure Workflow

```yaml
name: Claude Assistant

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]
  pull_request_review:
    types: [submitted]

jobs:
  claude-response:
    if: contains(github.event.comment.body, '@claude') ||
        contains(github.event.review.body, '@claude') ||
        github.event.action == 'assigned'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write
      id-token: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Run Claude
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ZAI_API_KEY }}
          settings: |
            {
              "env": {
                "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
                "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7",
                "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7",
                "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air",
                "API_TIMEOUT_MS": "3000000"
              }
            }
```

### Alternative: Direct Environment Variables

```yaml
- name: Run Claude with Z.ai
  uses: anthropics/claude-code-action@v1
  env:
    ANTHROPIC_BASE_URL: https://api.z.ai/api/anthropic
    ANTHROPIC_DEFAULT_SONNET_MODEL: glm-4.7
  with:
    anthropic_api_key: ${{ secrets.ZAI_API_KEY }}
```

## Model Mappings

When using Z.ai, Claude models map to GLM models:

| Claude Model | Z.ai GLM Model | Use Case                   |
| ------------ | -------------- | -------------------------- |
| Opus         | GLM-4.7        | Complex reasoning tasks    |
| Sonnet       | GLM-4.7        | Balanced performance       |
| Haiku        | GLM-4.5-Air    | Fast, lightweight tasks    |

## Limitations and Considerations

1. **Model Differences**: GLM-4.7 is not Claude - responses may differ in style and capabilities
2. **API Compatibility**: Z.ai implements Anthropic API format, but edge cases may exist
3. **Rate Limits**: Z.ai has its own rate limits separate from Anthropic
4. **Support**: Issues with Z.ai integration should go to Z.ai support, not Anthropic

## Verification Steps

After configuring:

1. Create a test issue or PR comment mentioning `@claude`
2. Check workflow logs for successful API connection
3. Verify response quality matches expectations

## References

- [Claude Code GitHub Action](https://github.com/anthropics/claude-code-action)
- [Z.ai Developer Documentation](https://docs.z.ai/scenario-example/develop-tools/claude)
- [Z.ai API Console](https://z.ai/model-api)
- [Claude Code GitHub Actions Docs](https://code.claude.com/docs/en/github-actions)

## Conclusion

**Yes, it is possible to use Z.ai API keys with Claude Code GitHub Actions** by setting the `ANTHROPIC_BASE_URL` environment variable to `https://api.z.ai/api/anthropic` and using your Z.ai API key in place of the Anthropic API key.

This allows mentioning `@claude` on GitHub issues and PRs while the actual processing is done through Z.ai's GLM models rather than Anthropic's Claude models directly.
