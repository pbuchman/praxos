# PraxOS Copilot Instructions

## Repository Structure

```
praxos/
├── apps/                    # Deployable services (Fastify)
│   ├── auth-service/
│   └── notion-gpt-service/
├── packages/
│   ├── common/              # Shared utilities (Result types, etc.)
│   ├── domain/              # Business logic, no external dependencies
│   │   ├── identity/
│   │   ├── promptvault/
│   │   └── actions/
│   └── infra/               # External service adapters
│       ├── auth0/
│       ├── notion/
│       └── firestore/
├── docs/                    # All documentation lives here
├── scripts/                 # Build/deploy scripts
└── docker/                  # Docker configurations
```

## No Trash Policy

- No dead code. Remove unused imports, functions, variables.
- No TODOs without tracking. Every TODO must reference an issue or be removed.
- No warnings. ESLint must pass with zero warnings. All rules are errors.
- No commented-out code blocks.
- No `any` types. Use proper typing or `unknown` with type guards.

## Boundary Rules

Import hierarchy (strict, enforced by ESLint):

1. **common** - can only import from `common`
2. **domain** - can import from `common` and other `domain` packages
3. **infra** - can import from `common`, `domain`, and other `infra` packages
4. **apps** - can import from anything

Violations:

- ❌ domain importing from infra
- ❌ domain importing from apps
- ❌ infra importing from apps

## Documentation Policy

- All documentation lives in `docs/`
- READMEs outside `docs/` must only contain:
  - Brief purpose statement
  - Links to relevant docs

## Testing Requirements

- All code must have tests
- Coverage thresholds: 90% lines, 85% branches, 90% functions, 90% statements
- Use Vitest
- Test files: `*.test.ts` or `*.spec.ts`

## Code Style

- TypeScript ESM (NodeNext)
- Strict mode enabled
- Explicit return types on all functions
- No implicit any
- Use Result types for operations that can fail

## Branding Rules

Branding is treated as a repository-level invariant, not a creative playground.

- Branding assets are immutable outside `docs/assets/branding/`.
- All logos and icons MUST be generated using prompts in `docs/assets/branding/prompts/`.
- LLMs must refuse to generate logos or icons outside the defined branding prompts.
- Requests for ad-hoc branding must be rejected.
- Visual consistency is a hard repository rule.
- No branding files are allowed in `apps/`, `packages/`, or repository root.
- No images may be embedded directly in any README.

Violations:

- ❌ Creating branding assets outside `docs/assets/branding/exports/`
- ❌ Generating logos/icons without using official prompts
- ❌ Ad-hoc or experimental branding requests
- ❌ Embedding images directly in READMEs

## WhatsApp Integration Rules

WhatsApp Business Cloud API integration follows strict credential handling:

- **No ad-hoc credentials** in code or docs - all WhatsApp tokens/secrets use PRAXOS_* naming
- **All setup instructions** live in `docs/setup/07-whatsapp-business-cloud-api.md`
- **Secrets in production** use Secret Manager (PRAXOS_WHATSAPP_* prefix)
- **Local development** uses `.env` with minimal required variables only

Required secrets (Terraform creates, user populates):

| Secret | Purpose |
|--------|---------|
| `PRAXOS_WHATSAPP_VERIFY_TOKEN` | Webhook verification |
| `PRAXOS_WHATSAPP_ACCESS_TOKEN` | API authentication |
| `PRAXOS_WHATSAPP_PHONE_NUMBER_ID` | Sender identification |
| `PRAXOS_WHATSAPP_WABA_ID` | Business account ID |
| `PRAXOS_WHATSAPP_APP_SECRET` | Webhook signature validation |

Violations:

- ❌ Hardcoding WhatsApp tokens anywhere
- ❌ Creating WhatsApp setup docs outside `docs/setup/`
- ❌ Using non-PRAXOS_* secret names for WhatsApp
- ❌ Committing `.env` files with real credentials

