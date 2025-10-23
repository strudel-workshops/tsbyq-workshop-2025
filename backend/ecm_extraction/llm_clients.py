"""LLM client helpers for ECM extraction - Workshop version."""

from __future__ import annotations
import os
import time
from typing import Any, Dict, List, Optional, Protocol
import requests


class LLMClientProtocol(Protocol):
    """Structural protocol for workshop LLM clients."""

    provider_name: str

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.0,
        max_tokens: Optional[int] = None,
    ) -> str:
        ...

    def extract_with_prompt(
        self,
        system_prompt: str,
        user_content: str,
        model: Optional[str] = None,
        temperature: float = 0.0,
    ) -> str:
        ...

    def chat(self, prompt: str, model: Optional[str] = None, temperature: float = 0.0) -> str:
        ...


class CBorgLLMClient:
    """Simplified CBorg API client for chat completions."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://api.cborg.lbl.gov",
        default_model: str = "anthropic/claude-haiku:latest",
    ):
        """Initialize CBorg client.

        Args:
            api_key: CBorg API key (defaults to CBORG_API_KEY env var)
            base_url: CBorg API base URL
            default_model: Default model to use for chat completions
        """
        self.api_key = api_key or os.environ.get("CBORG_API_KEY")
        if not self.api_key:
            raise ValueError(
                "CBorg API key not found. Set CBORG_API_KEY environment variable "
                "or pass api_key parameter."
            )

        self.base_url = base_url.rstrip("/")
        self.default_model = default_model
        self.provider_name = "cborg"

        # Usage tracking
        self.total_usage: Dict[str, Any] = {
            "chat_invokes": 0,
            "total_input_tokens": 0,
            "total_output_tokens": 0,
            "total_execution_time": 0.0,
        }

    def chat(self, prompt: str, model: Optional[str] = None, temperature: float = 0.0) -> str:
        """Simple chat interface - takes a string prompt.

        Args:
            prompt: User prompt text
            model: Model to use (defaults to self.default_model)
            temperature: Sampling temperature (0-1)

        Returns:
            Response text from the model
        """
        messages = [{"role": "user", "content": prompt}]
        return self.chat_completion(messages, model=model, temperature=temperature)

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.0,
        max_tokens: Optional[int] = None,
    ) -> str:
        """Send chat completion request to CBorg API.

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model to use (defaults to self.default_model)
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens in response

        Returns:
            Response text from the model
        """
        url = f"{self.base_url}/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model or self.default_model,
            "messages": messages,
            "temperature": temperature,
        }

        if max_tokens:
            payload["max_tokens"] = max_tokens

        start_time = time.time()

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            response.raise_for_status()
        except requests.exceptions.RequestException as exc:
            error_detail = ""
            try:
                error_detail = f" - Response: {response.text}"
            except:
                pass
            print(f"CBorg API Error: {exc}{error_detail}")
            print(f"Request payload: {payload}")
            raise RuntimeError(f"CBorg API request failed: {exc}{error_detail}") from exc

        elapsed_time = time.time() - start_time
        result = response.json()

        # Extract response text
        try:
            content = result["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:
            raise RuntimeError(f"Unexpected API response format: {result}") from exc

        # Track usage
        usage = result.get("usage", {})
        self.total_usage["chat_invokes"] += 1
        self.total_usage["total_input_tokens"] += usage.get("prompt_tokens", 0)
        self.total_usage["total_output_tokens"] += usage.get("completion_tokens", 0)
        self.total_usage["total_execution_time"] += elapsed_time

        return content

    def extract_with_prompt(
        self,
        system_prompt: str,
        user_content: str,
        model: Optional[str] = None,
        temperature: float = 0.0,
    ) -> str:
        """Convenience method for system + user message pattern.

        Args:
            system_prompt: System message (instructions)
            user_content: User message (content to process)
            model: Model to use
            temperature: Sampling temperature

        Returns:
            Response text from the model
        """
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]

        return self.chat_completion(
            messages=messages,
            model=model,
            temperature=temperature,
        )

    def print_usage_summary(self):
        """Print summary of API usage."""
        usage = self.total_usage
        print("\n=== CBorg API Usage Summary ===")
        print(f"Total API calls: {usage['chat_invokes']}")
        print(f"Total input tokens: {usage['total_input_tokens']:,}")
        print(f"Total output tokens: {usage['total_output_tokens']:,}")
        print(f"Total tokens: {usage['total_input_tokens'] + usage['total_output_tokens']:,}")
        print(f"Total execution time: {usage['total_execution_time']:.2f}s")
        print("=" * 32)


class OpenRouterLLMClient:
    """Simplified OpenRouter API client for chat completions."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://openrouter.ai/api/v1",
        default_model: str = "anthropic/claude-3.5-sonnet",
        referer: Optional[str] = None,
        site_name: Optional[str] = None,
    ):
        """Initialize OpenRouter client.

        Args:
            api_key: OpenRouter API key (defaults to OPENROUTER_API_KEY env var)
            base_url: OpenRouter API base URL
            default_model: Default model identifier
            referer: Optional site URL sent via HTTP-Referer header
            site_name: Optional site name sent via X-Title header
        """
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError(
                "OpenRouter API key not found. Set OPENROUTER_API_KEY environment variable "
                "or pass api_key parameter."
            )

        self.base_url = base_url.rstrip("/")
        self.default_model = default_model
        self.referer = referer or os.environ.get("OPENROUTER_SITE_URL")
        self.site_name = site_name or os.environ.get("OPENROUTER_SITE_NAME")
        self.provider_name = "openrouter"

        self.total_usage: Dict[str, Any] = {
            "chat_invokes": 0,
            "total_input_tokens": 0,
            "total_output_tokens": 0,
            "total_execution_time": 0.0,
        }

    def chat(self, prompt: str, model: Optional[str] = None, temperature: float = 0.0) -> str:
        """Simple chat interface - takes a string prompt."""
        messages = [{"role": "user", "content": prompt}]
        return self.chat_completion(messages, model=model, temperature=temperature)

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.0,
        max_tokens: Optional[int] = None,
    ) -> str:
        """Send chat completion request to OpenRouter API."""
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        if self.referer:
            headers["HTTP-Referer"] = self.referer
        if self.site_name:
            headers["X-Title"] = self.site_name

        payload: Dict[str, Any] = {
            "model": model or self.default_model,
            "messages": messages,
            "temperature": temperature,
        }

        if max_tokens:
            payload["max_tokens"] = max_tokens

        start_time = time.time()

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            response.raise_for_status()
        except requests.exceptions.RequestException as exc:
            error_detail = ""
            try:
                error_detail = f" - Response: {response.text}"
            except Exception:
                pass
            print(f"OpenRouter API Error: {exc}{error_detail}")
            print(f"Request payload: {payload}")
            raise RuntimeError(f"OpenRouter API request failed: {exc}{error_detail}") from exc

        elapsed_time = time.time() - start_time
        result = response.json()

        try:
            content = result["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:
            raise RuntimeError(f"Unexpected API response format: {result}") from exc

        usage = result.get("usage", {})
        self.total_usage["chat_invokes"] += 1
        self.total_usage["total_input_tokens"] += usage.get("prompt_tokens", 0)
        self.total_usage["total_output_tokens"] += usage.get("completion_tokens", 0)
        self.total_usage["total_execution_time"] += elapsed_time

        return content

    def extract_with_prompt(
        self,
        system_prompt: str,
        user_content: str,
        model: Optional[str] = None,
        temperature: float = 0.0,
    ) -> str:
        """Convenience method for system + user message pattern."""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]

        return self.chat_completion(
            messages=messages,
            model=model,
            temperature=temperature,
        )

    def print_usage_summary(self):
        """Print summary of API usage."""
        usage = self.total_usage
        print("\n=== OpenRouter API Usage Summary ===")
        print(f"Total API calls: {usage['chat_invokes']}")
        print(f"Total input tokens: {usage['total_input_tokens']:,}")
        print(f"Total output tokens: {usage['total_output_tokens']:,}")
        print(f"Total tokens: {usage['total_input_tokens'] + usage['total_output_tokens']:,}")
        print(f"Total execution time: {usage['total_execution_time']:.2f}s")
        print("=" * 36)
