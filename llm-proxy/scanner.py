"""Deterministic inspection of LLM request/response payloads.

Design rule: scan for things that have signatures, never for intent.

Detectors are split into two tiers, and the split is the whole point:

  BLOCK  structural facts with near-zero false-positive rate — invisible
         characters, encoding smuggling, fence violations, leaked canaries,
         credentials. A hit is a decision, not an opinion.

  FLAG   semantic heuristics (imperative phrasing and friends). These are
         advisory only. They raise a risk score and can route to human
         review; they must never block, because on a corpus of real source
         code they fire constantly on legitimate content.

Nothing here is a security boundary. It is high-precision, low-recall
detection. The boundary is gate.py, which constrains what the model is
permitted to *do* regardless of what this scanner did or did not see.
"""

from __future__ import annotations

import base64
import binascii
import re
import unicodedata
from dataclasses import dataclass, field
from enum import Enum
from typing import Iterable, Iterator, Sequence


class Action(Enum):
    BLOCK = "block"
    FLAG = "flag"


@dataclass(frozen=True)
class Finding:
    rule: str
    action: Action
    detail: str
    span: tuple[int, int] | None = None

    def __str__(self) -> str:  # pragma: no cover - display only
        where = f" at {self.span[0]}:{self.span[1]}" if self.span else ""
        return f"[{self.action.value.upper()}] {self.rule}{where}: {self.detail}"


@dataclass
class ScanResult:
    findings: list[Finding] = field(default_factory=list)

    @property
    def blocked(self) -> bool:
        return any(f.action is Action.BLOCK for f in self.findings)

    @property
    def risk_score(self) -> int:
        """Advisory score for routing, not for blocking."""
        return sum(10 if f.action is Action.BLOCK else 1 for f in self.findings)

    def rules(self) -> set[str]:
        return {f.rule for f in self.findings}


# --------------------------------------------------------------------------
# Tier 1 — structural. These block.
# --------------------------------------------------------------------------

_BIDI = {0x202A, 0x202B, 0x202C, 0x202D, 0x202E, 0x2066, 0x2067, 0x2068, 0x2069}
_ZERO_WIDTH = {0x200B, 0x200C, 0x200D, 0x2060, 0xFEFF}
# Tab, LF and CR are legitimate in source; every other C0/C1 control is not.
_ALLOWED_CONTROL = {0x09, 0x0A, 0x0D}


def scan_unicode(text: str) -> Iterator[Finding]:
    """Invisible and direction-altering characters.

    Catches Trojan-Source style attacks where the agent's tokenizer and a
    human reviewer see different text.
    """
    for i, ch in enumerate(text):
        cp = ord(ch)
        if cp in _BIDI:
            yield Finding("unicode.bidi", Action.BLOCK,
                          f"bidirectional control U+{cp:04X}", (i, i + 1))
        elif cp in _ZERO_WIDTH:
            yield Finding("unicode.zero_width", Action.BLOCK,
                          f"zero-width character U+{cp:04X}", (i, i + 1))
        elif cp < 0x20 and cp not in _ALLOWED_CONTROL:
            yield Finding("unicode.control", Action.BLOCK,
                          f"control character U+{cp:04X}", (i, i + 1))
        elif unicodedata.category(ch) == "Cf":
            yield Finding("unicode.format", Action.BLOCK,
                          f"format character U+{cp:04X}", (i, i + 1))


_SCRIPT_RANGES = (
    ("Latin", ((0x0041, 0x024F),)),
    ("Greek", ((0x0370, 0x03FF), (0x1F00, 0x1FFF))),
    ("Cyrillic", ((0x0400, 0x04FF), (0x0500, 0x052F))),
)


def _script_of(ch: str) -> str | None:
    cp = ord(ch)
    for name, ranges in _SCRIPT_RANGES:
        if any(lo <= cp <= hi for lo, hi in ranges):
            return name
    return None


_WORD = re.compile(r"[^\W\d_]{2,}", re.UNICODE)


def scan_mixed_script(text: str) -> Iterator[Finding]:
    """Homoglyph attacks: Cyrillic 'а' inside a Latin identifier."""
    for m in _WORD.finditer(text):
        scripts = {s for s in (_script_of(c) for c in m.group()) if s}
        if len(scripts) > 1:
            yield Finding("unicode.mixed_script", Action.BLOCK,
                          f"token {m.group()!r} mixes scripts {sorted(scripts)}",
                          m.span())


_B64_RUN = re.compile(r"[A-Za-z0-9+/]{32,}={0,2}")


def scan_encoding_smuggling(text: str, min_printable_ratio: float = 0.85) -> Iterator[Finding]:
    """Base64 blobs that decode to text.

    A payload the model will happily decode and act on, that no text-level
    rule will ever match in its encoded form.
    """
    for m in _B64_RUN.finditer(text):
        blob = m.group()
        # Base64 needs a length divisible by 4; trim rather than pad so we
        # do not manufacture decodes that were not really there.
        trimmed = blob[: len(blob) - (len(blob) % 4)]
        if len(trimmed) < 32:
            continue
        try:
            raw = base64.b64decode(trimmed, validate=True)
        except (binascii.Error, ValueError):
            continue
        if not raw:
            continue
        printable = sum(1 for b in raw if 0x20 <= b < 0x7F or b in (0x09, 0x0A, 0x0D))
        if printable / len(raw) >= min_printable_ratio:
            preview = raw[:60].decode("ascii", "replace")
            yield Finding("encoding.base64_text", Action.BLOCK,
                          f"base64 run decodes to text: {preview!r}", m.span())


def scan_fence(text: str, nonce: str) -> Iterator[Finding]:
    """Fence integrity for untrusted content.

    Untrusted blocks are wrapped in a per-request random nonce so a payload
    cannot close its own fence. If the nonce appears inside the payload, the
    nonce leaked and every fence in this request is untrustworthy.
    """
    if not nonce:
        yield Finding("fence.missing_nonce", Action.BLOCK,
                      "untrusted content submitted without a fence nonce")
        return
    if text.count(nonce):
        yield Finding("fence.nonce_in_payload", Action.BLOCK,
                      "fence nonce appears inside untrusted content")


# --------------------------------------------------------------------------
# Tier 1 — secrets and canaries. These block. Credentials have formats,
# which is exactly why regex is the right tool here and the wrong tool
# for injection.
# --------------------------------------------------------------------------

_SECRET_RULES: Sequence[tuple[str, re.Pattern[str]]] = (
    ("aws_access_key", re.compile(r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b")),
    ("github_token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{36,}\b")),
    ("slack_token", re.compile(r"\bxox[baprs]-[0-9A-Za-z-]{10,}\b")),
    ("private_key", re.compile(r"-----BEGIN(?: [A-Z]+)* PRIVATE KEY-----")),
    ("jwt", re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b")),
    ("generic_bearer", re.compile(r"\bBearer\s+[A-Za-z0-9._~+/-]{24,}=*\b")),
)


def scan_secrets(text: str) -> Iterator[Finding]:
    for name, pattern in _SECRET_RULES:
        for m in pattern.finditer(text):
            yield Finding(f"secret.{name}", Action.BLOCK,
                          f"credential-shaped string ({name})", m.span())


def scan_canary(text: str, canaries: Iterable[str]) -> Iterator[Finding]:
    """A canary outside its request is proof of exfiltration, not a guess."""
    for canary in canaries:
        if canary and canary in text:
            yield Finding("canary.leaked", Action.BLOCK,
                          "request-scoped canary present in outbound data")


# --------------------------------------------------------------------------
# Tier 2 — semantic heuristics. These FLAG only.
#
# Kept deliberately small. Every pattern here has a high false-positive rate
# against real source code, security documentation, and test fixtures. They
# exist to raise a risk score, never to make a decision.
# --------------------------------------------------------------------------

_IMPERATIVE_RULES: Sequence[tuple[str, re.Pattern[str]]] = (
    ("override", re.compile(
        r"\b(?:ignore|disregard|forget|override)\b[^.\n]{0,40}"
        r"\b(?:previous|prior|above|earlier|system|instruction)", re.I)),
    ("role_markup", re.compile(
        r"<\s*/?\s*(?:important|system|instructions?|admin)\b", re.I)),
    ("agent_address", re.compile(
        r"\b(?:note|instruction|directive)s?\s+(?:to|for)\s+"
        r"(?:the\s+)?(?:ai|llm|agent|assistant|automated|review)", re.I)),
    ("exfil_shape", re.compile(
        r"\b(?:urllib|requests|fetch|curl|wget)\b[^\n]{0,80}"
        r"\b(?:environ|getenv|process\.env|token|secret)\b", re.I)),
)


def scan_imperatives(text: str) -> Iterator[Finding]:
    for name, pattern in _IMPERATIVE_RULES:
        for m in pattern.finditer(text):
            yield Finding(f"heuristic.{name}", Action.FLAG,
                          f"advisory: matched {name}", m.span())


# --------------------------------------------------------------------------
# Entry points
# --------------------------------------------------------------------------

def scan_untrusted(text: str, *, nonce: str = "") -> ScanResult:
    """Inspect a block of untrusted content on its way to the model."""
    result = ScanResult()
    result.findings.extend(scan_unicode(text))
    result.findings.extend(scan_mixed_script(text))
    result.findings.extend(scan_encoding_smuggling(text))
    result.findings.extend(scan_fence(text, nonce))
    result.findings.extend(scan_imperatives(text))
    return result


def scan_outbound(text: str, *, canaries: Iterable[str] = ()) -> ScanResult:
    """Inspect data leaving the trust boundary — to the model, or in a tool arg.

    This is where regex genuinely earns its place.
    """
    result = ScanResult()
    result.findings.extend(scan_secrets(text))
    result.findings.extend(scan_canary(text, canaries))
    return result


def scan_stream_window(chunks: Sequence[str], *, canaries: Iterable[str] = (),
                       overlap: int = 64) -> ScanResult:
    """Outbound scan over a sliding window.

    Streaming splits tokens across events, so a credential can straddle a
    chunk boundary and evade a per-chunk scan. Re-scan each chunk joined to
    the tail of the previous one.
    """
    result = ScanResult()
    tail = ""
    for chunk in chunks:
        result.findings.extend(scan_outbound(tail + chunk, canaries=canaries).findings)
        tail = (tail + chunk)[-overlap:]
    # Deduplicate: the overlap means a finding can be seen twice.
    seen: set[tuple[str, str]] = set()
    unique = []
    for f in result.findings:
        key = (f.rule, f.detail)
        if key not in seen:
            seen.add(key)
            unique.append(f)
    result.findings = unique
    return result
