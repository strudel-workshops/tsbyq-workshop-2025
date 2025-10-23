"""ECM Extraction Package - Simplified version for workshop."""

__version__ = "0.1.0"

from .llm_clients import (  # noqa: F401
    CBorgLLMClient,
    OpenRouterLLMClient,
    LLMClientProtocol,
)
