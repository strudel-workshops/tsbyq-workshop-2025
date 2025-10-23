"""Configuration helpers for the ECM extractor backend."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict

import yaml

from ecm_extraction.llm_clients import CBorgLLMClient, OpenRouterLLMClient


DEFAULT_CONFIG: Dict[str, Any] = {
    "llm": {
        "default_provider": "cborg",
        "extraction_provider": None,
        "chat_provider": None,
        "providers": {
            "cborg": {
                "base_url": "https://api.cborg.lbl.gov",
                "default_model": "anthropic/claude-haiku:latest",
            },
        "openrouter": {
            "base_url": "https://openrouter.ai/api/v1",
            "default_model": "anthropic/claude-sonnet-4.5",
            "referer": None,
            "site_name": None,
        },
        },
    },
}

CONFIG_PATH = Path(__file__).parent / "config.yaml"


def _deep_update(base: Dict[str, Any], overrides: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively merge dictionaries."""
    for key, value in overrides.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            base[key] = _deep_update(base[key], value)
        else:
            base[key] = value
    return base


@lru_cache(maxsize=1)
def get_config() -> Dict[str, Any]:
    """Load backend configuration from config.yaml with defaults."""
    config = DEFAULT_CONFIG.copy()
    config["llm"] = config["llm"].copy()
    config["llm"]["providers"] = {
        key: value.copy() for key, value in config["llm"]["providers"].items()
    }

    if CONFIG_PATH.exists():
        with CONFIG_PATH.open("r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        if isinstance(data, dict):
            config = _deep_update(config, data)

    return config


def get_llm_provider(use_case: str = "default") -> str:
    """Return the configured provider key for the requested use-case."""
    config = get_config().get("llm", {})
    env_override = os.environ.get(f"LLM_PROVIDER_{use_case.upper()}")
    if env_override:
        return env_override.lower()

    if use_case != "default":
        specific_key = f"{use_case}_provider"
        provider = config.get(specific_key)
        if provider:
            return provider.lower()

    provider = config.get("default_provider", "cborg")
    return provider.lower()


def create_llm_client(use_case: str = "default"):
    """Create an LLM client instance based on configuration."""
    provider_key = get_llm_provider(use_case)
    llm_config = get_config().get("llm", {})
    providers = llm_config.get("providers", {})
    provider_config = providers.get(provider_key, {})

    if provider_key == "cborg":
        kwargs = {k: v for k, v in provider_config.items() if v is not None}
        return CBorgLLMClient(**kwargs)

    if provider_key == "openrouter":
        kwargs = {k: v for k, v in provider_config.items() if v is not None}
        return OpenRouterLLMClient(**kwargs)

    raise ValueError(f"Unsupported LLM provider: {provider_key}")
