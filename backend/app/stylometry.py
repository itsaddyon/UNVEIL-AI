"""
Persona DNA — deterministic, reproducible stylometric fingerprinting from a
persona's own posts. No LLM, no personality profiling: every dimension below
is a plain statistical measure computed directly from post text, with full
provenance (which post IDs fed it) and a versioned method, so the same
input always reproduces the exact same fingerprint.
"""
import re
import math
from collections import Counter
from . import models

METHOD_VERSION = "stylometry_v1"

FUNCTION_WORDS = [
    "the", "and", "of", "to", "in", "a", "is", "that", "it", "for", "on",
    "with", "as", "was", "at", "by", "an", "be", "this", "from", "or",
    "which", "but", "not", "are",
]

def _split_sentences(text: str) -> list[str]:
    parts = re.split(r"[.!?]+", text)
    return [p.strip() for p in parts if p.strip()]

def _words(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z']+", text.lower())

def compute_persona_dna(db, persona_id: int) -> dict:
    posts = db.query(models.Post).filter(models.Post.persona_id == persona_id).all()
    all_text = " ".join(p.content for p in posts)

    sentences = []
    for p in posts:
        sentences.extend(_split_sentences(p.content))
    sentence_lengths = [len(_words(s)) for s in sentences] or [0]

    all_words = _words(all_text)
    total_words = len(all_words) or 1
    vocabulary_richness = len(set(all_words)) / total_words

    punctuation_count = len(re.findall(r"[.,!?;:]", all_text))
    punctuation_rate = punctuation_count / (len(all_text) or 1)

    word_counts = Counter(all_words)
    function_word_freq = {w: round(word_counts.get(w, 0) / total_words, 4) for w in FUNCTION_WORDS}

    return {
        "persona_id": persona_id,
        "method_version": METHOD_VERSION,
        "source_post_ids": [p.id for p in posts],
        "avg_sentence_length": round(sum(sentence_lengths) / len(sentence_lengths), 3),
        "sentence_length_sequence": sentence_lengths,
        "vocabulary_richness": round(vocabulary_richness, 4),
        "punctuation_rate": round(punctuation_rate, 4),
        "function_word_freq": function_word_freq,
    }

def _relative_similarity(a: float, b: float) -> float:
    denom = max(a, b, 1e-6)
    return max(0.0, 1 - abs(a - b) / denom)

def _cosine_similarity(vec_a: dict, vec_b: dict) -> float:
    keys = vec_a.keys()
    norm_a = math.sqrt(sum(v * v for v in vec_a.values()))
    norm_b = math.sqrt(sum(v * v for v in vec_b.values()))
    if norm_a == 0 and norm_b == 0:
        # neither persona uses ANY tracked function word — that shared absence
        # is itself a real stylistic match, not "no signal"
        return 1.0
    if norm_a == 0 or norm_b == 0:
        return 0.0
    dot = sum(vec_a[k] * vec_b[k] for k in keys)
    return dot / (norm_a * norm_b)

def compare_dna(dna_a: dict, dna_b: dict) -> dict:
    """Per-dimension + overall similarity between two persona fingerprints.
    This is the ONLY place stylometric similarity gets computed — the
    attribution engine calls this instead of trusting any static value."""
    rhythm = _relative_similarity(dna_a["avg_sentence_length"], dna_b["avg_sentence_length"])
    vocab = _relative_similarity(dna_a["vocabulary_richness"], dna_b["vocabulary_richness"])
    punct = _relative_similarity(dna_a["punctuation_rate"], dna_b["punctuation_rate"])
    func = _cosine_similarity(dna_a["function_word_freq"], dna_b["function_word_freq"])

    overall = round((rhythm + vocab + punct + func) / 4, 4)
    return {
        "overall_similarity": overall,
        "dimensions": {
            "sentence_rhythm": round(rhythm, 4),
            "vocabulary_richness": round(vocab, 4),
            "punctuation_habits": round(punct, 4),
            "function_word_usage": round(func, 4),
        },
        "method_version": METHOD_VERSION,
    }
