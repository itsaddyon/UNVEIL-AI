# LLM Provider Strategy — UNVEIL AI

## The honest answer first

I can't provision you a free Anthropic API key for use outside this chat — API access is billed to whoever's account calls it, and I have no way to grant that independently of you setting up your own account. What I *can* do is make sure the codebase never assumes any specific paid provider, so the team isn't blocked and isn't stuck with a surprise bill mid-hackathon. That's the approach below.

## Design: one interface, four interchangeable backends

The Attribution Engine never depends on an LLM (see Phase 0 blueprint, Section 4 — scoring is pure Python/stats). The LLM is only used for the "Explanation" step: turning an already-computed evidence bundle into readable prose. Because of that narrow, well-defined job, swapping providers is low-risk.

```python
class ExplanationProvider(Protocol):
    def explain(self, evidence_bundle: dict) -> str: ...

# implementations, all satisfying the same interface:
# - AnthropicProvider   (needs ANTHROPIC_API_KEY)
# - GeminiProvider       (needs GOOGLE_API_KEY)
# - OllamaProvider       (local, free, needs Ollama running)
# - TemplateProvider     (no key, no network, default fallback)
```

Selected via one environment variable (`EXPLANATION_PROVIDER=template|anthropic|gemini|ollama`) read at startup. Nothing else in the codebase changes when you switch.

## What I'd actually recommend for your situation

1. **Default provider: `TemplateProvider`.** A small set of sentence templates filled in from the structured evidence (e.g. "ShadowFox and NightFox share a PGP fingerprint observed on {date} and a wallet linked on {date}, giving a stylometric overlap of {pct}%."). Zero cost, zero network dependency, and — importantly for demo day — zero risk of an API outage or rate limit killing your live demo in front of judges.
2. **Judge-facing "wow" mode: Google Gemini free tier** (`gemini-2.0-flash` via Google AI Studio) if you want genuinely generative prose for the final showcase. Free tier is generous enough for a hackathon demo and needs no credit card.
3. **Optional, if a teammate already has Anthropic API access:** the `AnthropicProvider` slot is there and ready — just drop in a key.
4. **Fully offline fallback:** `Ollama` running a small open-weight model locally, useful only if you want it to work with zero internet at the venue.

This way nothing in Phase 6 (Orchestrator) or Phase 7 (Attribution Engine) is blocked by a billing decision, and you can decide the actual provider as late as the week of the demo.
