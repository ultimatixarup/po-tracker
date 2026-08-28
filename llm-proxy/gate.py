"""Tool-call policy enforcement.

The scanner asks "is this input malicious?", which is undecidable.
This asks "is this action permitted for this role?", which is not.

Every tool call the model emits is validated here before the proxy forwards
it to the agent. A fully hijacked model can emit whatever it likes; if the
call is not in the role's allowlist, or its arguments do not validate, it
never reaches a runtime.
"""

from __future__ import annotations

import re
import secrets
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Mapping


class Denied(Exception):
    """A tool call was refused by policy. Never retried, always logged."""


@dataclass(frozen=True)
class Role:
    name: str
    allowed_tools: frozenset[str]
    repo_root: Path
    # Tools that may never be granted to a role that reads untrusted content,
    # regardless of how the allowlist is configured.
    forbidden_always: frozenset[str] = frozenset()

    def check_tool(self, tool: str) -> None:
        if tool in self.forbidden_always:
            raise Denied(f"tool {tool!r} is forbidden for any untrusted-input role")
        if tool not in self.allowed_tools:
            raise Denied(f"role {self.name!r} may not call {tool!r}")


# Anything that can execute code, now or later. A write tool is an exec tool
# with a delay: .git/hooks, CI workflow files, conftest.py, Makefile.
EXEC_TOOLS = frozenset({
    "execute_python", "run_python", "python", "repl",
    "run_bash", "bash", "shell", "exec", "run_command",
    "write_file", "edit_file", "apply_patch", "create_file",
})

REVIEWER = Role(
    name="reviewer",
    allowed_tools=frozenset({"read_blob", "list_changed_files",
                             "run_linter", "get_definition", "get_check_run"}),
    repo_root=Path("/srv/checkout"),
    forbidden_always=EXEC_TOOLS,
)

REMEDIATOR = Role(
    name="remediator",
    # Writes, but only inside the sandbox, and never an interpreter.
    allowed_tools=frozenset({"read_blob", "write_file", "run_test_suite", "run_linter"}),
    repo_root=Path("/srv/checkout"),
    forbidden_always=frozenset({"execute_python", "run_python", "python", "repl",
                                "run_bash", "bash", "shell", "exec", "run_command"}),
)


# --------------------------------------------------------------------------
# Argument validation
# --------------------------------------------------------------------------

_IDENTIFIER = re.compile(r"\A[A-Za-z_][A-Za-z0-9_.-]{0,127}\Z")

# Paths the agent may never write, whatever the role. These define the other
# controls, so a change here is a change to the control plane itself.
DENY_WRITE_PATHS = (
    ".github/", ".git/", ".gitattributes", "CODEOWNERS",
    "Makefile", "conftest.py", "package.json", "pyproject.toml",
    "terraform/", ".claude/",
)


def _resolved_repo_path(raw: Any, role: Role) -> Path:
    """Resolve a path argument and prove it lands inside the repo.

    Resolution follows symlinks first, so a symlink planted by a PR cannot
    be used to escape the checkout.
    """
    if not isinstance(raw, str) or not raw:
        raise Denied(f"path argument must be a non-empty string, got {type(raw).__name__}")
    if "\x00" in raw:
        raise Denied("path argument contains a NUL byte")
    candidate = (role.repo_root / raw).resolve()
    root = role.repo_root.resolve()
    if not candidate.is_relative_to(root):
        raise Denied(f"path {raw!r} resolves outside the repository root")
    return candidate


def _check_write_target(raw: str) -> None:
    # NB: str.lstrip("./") strips a character *set* and would eat the leading
    # dot of ".github/", letting control-plane writes past the deny list.
    normalised = raw
    while normalised.startswith("./"):
        normalised = normalised[2:]
    normalised = normalised.lstrip("/")
    for deny in DENY_WRITE_PATHS:
        if normalised == deny.rstrip("/") or normalised.startswith(deny):
            raise Denied(f"writes to {deny!r} are reserved for humans")


def _validate_read_blob(args: Mapping[str, Any], role: Role) -> None:
    _resolved_repo_path(args.get("path"), role)


def _validate_write_file(args: Mapping[str, Any], role: Role) -> None:
    path = args.get("path")
    _resolved_repo_path(path, role)
    _check_write_target(str(path))
    if not isinstance(args.get("content"), str):
        raise Denied("write_file requires string content")


def _validate_run_linter(args: Mapping[str, Any], role: Role) -> None:
    rule = args.get("rule_id")
    if not isinstance(rule, str) or not _IDENTIFIER.match(rule):
        raise Denied(f"rule_id must be a plain identifier, got {rule!r}")


def _validate_get_definition(args: Mapping[str, Any], role: Role) -> None:
    symbol = args.get("symbol")
    if not isinstance(symbol, str) or not _IDENTIFIER.match(symbol):
        raise Denied(f"symbol must be a plain identifier, got {symbol!r}")


def _validate_no_args(args: Mapping[str, Any], role: Role) -> None:
    if args:
        raise Denied("this tool takes no arguments")


VALIDATORS: Mapping[str, Callable[[Mapping[str, Any], Role], None]] = {
    "read_blob": _validate_read_blob,
    "write_file": _validate_write_file,
    "run_linter": _validate_run_linter,
    "get_definition": _validate_get_definition,
    "run_test_suite": _validate_no_args,
    "list_changed_files": _validate_no_args,
}


@dataclass
class ToolCall:
    name: str
    arguments: Mapping[str, Any] = field(default_factory=dict)


def gate_tool_call(call: ToolCall, role: Role) -> ToolCall:
    """Authorise one tool call. Raises Denied, or returns it unchanged."""
    role.check_tool(call.name)
    validator = VALIDATORS.get(call.name)
    if validator is None:
        # Fail closed: an allowlisted tool with no validator is a config bug,
        # not a licence to pass arbitrary arguments through.
        raise Denied(f"no argument validator registered for {call.name!r}")
    validator(call.arguments, role)
    return call


def mint_canary() -> str:
    """A per-request marker. If it ever appears outbound, data escaped."""
    return f"CANARY-{secrets.token_hex(16)}"


def fence(untrusted: str, nonce: str) -> str:
    """Wrap untrusted content so it cannot close its own delimiter.

    Necessary, not sufficient. This measurably lowers injection success
    rates and does not eliminate them; it is depth behind gate_tool_call,
    never a substitute for it.
    """
    return (f"<untrusted-data nonce={nonce}>\n"
            f"{untrusted}\n"
            f"</untrusted-data nonce={nonce}>")
