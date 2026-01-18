# Linear Agent - Agent Interface

Machine-readable interface definition for AI agents integrating with the Linear Agent service.

## Identity

| Field   | Value                                                    |
| ------- | -------------------------------------------------------- |
| Name    | linear-agent                                             |
| Role    | Natural Language to Linear Issue Converter               |
| Goal    | Create structured Linear issues from voice/text input    |

## Capabilities

### ProcessLinearAction

Create a Linear issue from natural language text.

```typescript
interface ProcessLinearActionRequest {
  action: {
    id: string;       // Unique action identifier
    userId: string;   // User making the request
    text: string;     // Natural language issue description
    summary?: string; // Optional pre-summarized version
  };
}

interface ProcessLinearActionResponse {
  status: 'completed' | 'failed';
  message: string;      // Human-readable feedback
  resourceUrl?: string; // Linear issue URL (on success)
  errorCode?: string;   // Error identifier (on failure)
}
```

**Endpoint:** `POST /internal/linear/process-action`
**Auth:** `X-Internal-Auth` header required

### ListIssues

Retrieve user's Linear issues grouped by dashboard column.

```typescript
interface ListIssuesRequest {
  includeArchive?: boolean; // Default: true
}

interface ListIssuesResponse {
  backlog: LinearIssue[];
  in_progress: LinearIssue[];
  in_review: LinearIssue[];
  done: LinearIssue[];
}
```

**Endpoint:** `GET /linear/issues`
**Auth:** Bearer token required

## Constraints

1. **Do not call** `/internal/linear/process-action` without a valid action ID
2. **Do not assume** Linear connection exists - check `/linear/connection` first
3. **Respect idempotency** - the service deduplicates by action ID
4. **Handle failures gracefully** - extraction failures return structured errors

## Usage Patterns

### Create Issue from Voice Note

```bash
# 1. Ensure user is connected
GET /linear/connection
Authorization: Bearer <token>

# 2. Process action (internal call from actions-agent)
POST /internal/linear/process-action
X-Internal-Auth: <internal-token>
Content-Type: application/json

{
  "action": {
    "id": "action-uuid-123",
    "userId": "user-uuid-456",
    "text": "Need to fix the login page timeout issue urgently"
  }
}

# Response
{
  "success": true,
  "data": {
    "status": "completed",
    "message": "Created Linear issue INT-789",
    "resourceUrl": "https://linear.app/team/issue/INT-789"
  }
}
```

### Handle Extraction Failure

```bash
# Process action that fails extraction
POST /internal/linear/process-action
{
  "action": {
    "id": "action-uuid-789",
    "userId": "user-uuid-456",
    "text": "..." // Ambiguous or too short text
  }
}

# Response
{
  "success": true,
  "data": {
    "status": "failed",
    "message": "Could not extract issue details from message",
    "errorCode": "EXTRACTION_FAILED"
  }
}

# User can review failed extractions
GET /linear/failed-issues
Authorization: Bearer <token>
```

## Priority Mapping

| Natural Language Cues                | Linear Priority |
| ------------------------------------ | --------------- |
| "urgent", "critical", "blocker"      | 1 (Urgent)      |
| "high priority", "important"         | 2 (High)        |
| (default, no cues)                   | 3 (Normal)      |
| "low priority", "when you have time" | 4 (Low)         |
| "no priority", "backlog"             | 0 (None)        |
