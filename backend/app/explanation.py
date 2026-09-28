"""
Pluggable explanation layer (see docs/LLM_PROVIDER_STRATEGY.md).
TemplateProvider needs no key, no network, and never invents anything not
present in the structured evidence it's given — safe default for the orchestrator.
"""
from typing import Protocol, List, Dict

class ExplanationProvider(Protocol):
    def explain(self, persona_handle: str, relationships: List[dict], evidence_by_rel: Dict[int, list]) -> str: ...

class TemplateProvider:
    def explain(self, persona_handle, relationships, evidence_by_rel) -> str:
        if not relationships:
            return f"No correlated relationships were found for {persona_handle}."
        sentences = []
        for rel in relationships:
            ev_types = [e["type"].replace("_", " ") for e in evidence_by_rel.get(rel["id"], [])]
            reasons = ", ".join(ev_types) if ev_types else "no supporting evidence on file"
            sentences.append(
                f"{rel['from']} and {rel['to']} show a {round(rel['strength'] * 100)}% correlation, "
                f"supported by: {reasons}."
            )
        return " ".join(sentences)
