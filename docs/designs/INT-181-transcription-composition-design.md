# Design: Improve Transcription Composition and Formatting (INT-181)

**Status:** Draft - Open Questions Pending
**Related Issue:** [INT-181](https://linear.app/pbuchman/issue/INT-181/improve-transcription-composition-and-formatting)
**Date:** 2026-01-21

---

## Problem Statement

Current transcription output has composition issues:

1. Uses markdown formatting (`*bold*`, bullet points) which may not render correctly in all contexts
2. Missing introductory phrase indicating the message is a summary of user speech
3. Summary format shows raw "Key Points" bullet lists instead of natural prose
4. Language of intro phrase should match speech language

### Current Output Example (problematic)

```
🎙️ *Transcription:*

<raw transcript text>

📝 *Summary:*

## Key Points

* Gran Canaria, miejscowości Maspalomas...
* Unikanie booking.com...
* Przewodniki o zwiedzaniu...
```

### Desired Output Example

```
Poniżej znajduje się podsumowanie tego, co powiedziałeś:

Gran Canaria - poszukujesz tanich noclegów last minute w Maspalomas lub Las Palmas. Wolisz unikać booking.com i szukasz lokalnych stron oraz porad od podróżników. Interesują Cię również przewodniki o zwiedzaniu wyspy.
```

---

## Current Architecture

### Key Files

| File | Purpose |
| ---- | ------- |
| `apps/whatsapp-service/src/domain/whatsapp/usecases/transcribeAudio.ts` | Message composition (`sendSuccessMessage()` at L525-543) |
| `apps/whatsapp-service/src/infra/speechmatics/adapter.ts` | Transcript fetch, summary extraction (`getTranscript()` at L477-556) |
| `apps/whatsapp-service/src/domain/whatsapp/ports/transcription.ts` | `TranscriptionTextResult` interface |

### Current Message Composition (L525-543)

```typescript
private async sendSuccessMessage(transcript: string, summary?: string): Promise<void> {
  let message = `🎙️ *Transcription:*\n\n${transcript}`;
  if (summary !== undefined) {
    message += `\n\n📝 *Summary:*\n\n${summary}`;
  }
  // ... send via WhatsApp
}
```

### Current Speechmatics Config

- `summary_type: 'bullets'` - Returns bullet point summaries
- `summary_length: 'brief'`
- `language: 'auto'` - Auto-detects language

---

## Proposed Changes

### 1. Remove Markdown Formatting

**Change:** Strip all markdown from output
- Remove `*bold*` formatting
- Remove emoji prefixes
- Remove section headers

### 2. Add Introductory Phrase

**Change:** Prepend language-appropriate intro phrase

| Detected Language | Intro Phrase |
| ----------------- | ------------ |
| Polish (`pl`) | "Poniżej znajduje się podsumowanie tego, co powiedziałeś:" |
| English (`en`) | "Below is a summary of what you said:" |
| Other/Unknown | Fall back to Polish, then English |

### 3. Change Summary Format

**Option A:** Change Speechmatics `summary_type` from `'bullets'` to `'paragraph'`
- Pros: Native prose output, no post-processing needed
- Cons: May lose structure, untested quality

**Option B:** Post-process bullet summary into prose
- Pros: Keep current quality, just reformat
- Cons: More complex, potential edge cases

**Option C:** Use LLM to reformat summary
- Pros: High quality natural language
- Cons: Additional API call, cost, latency

### 4. Language Detection for Intro Phrase

**Question:** Where does language info come from?

- Speechmatics auto-detects but doesn't expose detected language in transcript response
- May need to extract from response metadata
- Or use separate language detection

---

## Open Questions

### Q1: Summary Format Strategy

Which approach for converting bullet summaries to prose?

- [ ] **A.** Change Speechmatics config to `summary_type: 'paragraph'`
- [ ] **B.** Post-process bullets into prose with string manipulation
- [ ] **C.** Use LLM (which one?) to reformat
- [ ] **D.** Other approach?

**Considerations:**
- Quality vs complexity tradeoff
- Latency impact (LLM adds ~1-3s)
- Cost impact (LLM calls cost money)
- Speechmatics paragraph quality unknown

### Q2: Language Detection Source

How to determine speech language for intro phrase?

- [ ] **A.** Parse Speechmatics response metadata for detected language
- [ ] **B.** Use separate language detection API
- [ ] **C.** Analyze transcript text for language patterns
- [ ] **D.** User-configured preference
- [ ] **E.** Always use Polish (simplest, matches primary user base)

**Considerations:**
- Speechmatics `language: 'auto'` detects but may not expose result
- Need to verify what's available in the JSON response
- False detection could be jarring (wrong language intro)

### Q3: Fallback Chain

If language detection fails or is ambiguous, what's the fallback order?

- [ ] **A.** Polish → English
- [ ] **B.** English → Polish
- [ ] **C.** No intro phrase if uncertain
- [ ] **D.** Generic "Summary:" in both languages

### Q4: Full Transcript vs Summary Only

Should the output include:

- [ ] **A.** Summary only (cleaner, shorter)
- [ ] **B.** Full transcript + summary (current behavior minus markdown)
- [ ] **C.** User preference setting
- [ ] **D.** Summary with "tap for full transcript" option (if WhatsApp supports)

**Current behavior:** Shows both transcript and summary

### Q5: Emoji Usage

Should we keep emojis?

- [ ] **A.** Remove all emojis (pure text)
- [ ] **B.** Keep emojis but remove markdown
- [ ] **C.** Single emoji indicator only

**Current:** Uses 🎙️ and 📝 emojis

### Q6: Error Message Formatting

Should error messages also be reformatted?

- [ ] **A.** Yes, same rules (no markdown, plain text)
- [ ] **B.** No, keep current error format
- [ ] **C.** Simplified error messages

**Current error format:**
```
❌ *Transcription failed:*

<error details>
```

---

## Testing Strategy

Once decisions are made:

1. Unit tests for new formatting functions
2. Integration tests with mock Speechmatics responses
3. Manual verification with actual voice notes in Polish/English

---

## Implementation Estimate

Depending on answers to open questions:

| Approach | Scope |
| -------- | ----- |
| Simple (config change + string formatting) | ~2-4 hours |
| Medium (post-processing + language detection) | ~1 day |
| Complex (LLM integration for reformatting) | ~2-3 days |

---

## Next Steps

1. Get answers to open questions (Q1-Q6)
2. Update this design with decisions
3. Implement changes
4. Test with real voice notes
5. Deploy to development

---

## Appendix: Speechmatics Summary Types

From Speechmatics documentation:

| Type | Description |
| ---- | ----------- |
| `bullets` | Key points as bullet list (current) |
| `paragraph` | Flowing prose summary |
| `headline` | Single sentence headline |

Current config uses `bullets` with `brief` length.
