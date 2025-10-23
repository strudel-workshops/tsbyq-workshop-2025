"""ECM extraction using CBorg LLM - Simplified workshop version."""

from __future__ import annotations
import json
from typing import List
from pydantic import ValidationError

from .models import ECMRecord
from .llm_client import CBorgLLMClient


def create_extraction_prompt(markdown: str) -> str:
    """Create prompt for ECM extraction from markdown.

    Args:
        markdown: Document text in markdown format

    Returns:
        Formatted prompt for LLM
    """
    # Get JSON schema from Pydantic model
    schema = ECMRecord.model_json_schema()
    schema_json = json.dumps(schema, indent=2)

    prompt = f"""You are an expert at extracting Energy Conservation Measure (ECM) data from building audit reports.

TASK: Extract ALL Energy Conservation Measures from the document as an array of ECMRecord objects.

IMPORTANT REQUIREMENTS:
- Return a JSON array of ECMRecord objects (even if only one ECM found)
- Each ECM should be a separate, complete object
- Include building information in each record when available
- Use null for missing values - do not make up data

SCHEMA (each ECM record should match this structure):
```json
{schema_json}
```

EXTRACTION GUIDELINES:
1. Identify ALL Energy Conservation Measures in the document
2. For each ECM, extract:
   - Name and description
   - Cost estimates (with currency)
   - Energy savings (with units like kWh, MMBtu, etc.)
   - Payback period
   - Implementation status
   - Priority level if mentioned
3. Extract building information (name, address, type, floor area) if available
4. Extract audit information (date, auditor, type) if available
5. Format quantities as objects with "value" and "unit" keys
6. Normalize units (e.g., remove "/year" suffixes, use "kWh" not "kilowatt-hours")
7. Use canonical unit abbreviations: kWh, MMBtu, USD, sf, etc.

DOCUMENT CONTENT:
```markdown
{markdown}
```

RESPONSE FORMAT:
Return ONLY a JSON array of ECMRecord objects. No additional text or explanation.

Example:
```json
[
  {{
    "building_snapshot": {{
      "building_name": "Office Building A",
      "property_type": "Office",
      "gross_floor_area": {{"value": 50000, "unit": "sf"}}
    }},
    "ecm_detail": {{
      "name": "LED Lighting Upgrade",
      "description": "Replace existing T8 fluorescent fixtures with LED",
      "ecm_category": "Lighting",
      "cost_estimate": {{"value": 25000, "currency": "USD"}},
      "annual_cost_savings": {{"value": 5000, "currency": "USD"}},
      "annual_energy_savings": {{"value": 50000, "unit": "kWh"}},
      "simple_payback": {{"value": 5, "unit": "year"}},
      "implementation_status": "recommended",
      "priority": "high"
    }}
  }}
]
```

JSON RESPONSE:"""

    return prompt


def extract_ecms_from_markdown(
    markdown: str,
    client: CBorgLLMClient,
    model: str | None = None,
) -> List[ECMRecord]:
    """Extract ECM records from markdown using CBorg LLM.

    Args:
        markdown: Document content in markdown format
        client: Initialized CBorg LLM client
        model: Optional model override

    Returns:
        List of validated ECMRecord objects

    Raises:
        RuntimeError: If extraction or validation fails critically
    """
    if not markdown or not markdown.strip():
        print("Warning: Empty markdown provided")
        return []

    # Create extraction prompt
    prompt = create_extraction_prompt(markdown)

    # System message for the LLM
    system_msg = (
        "You are a data extraction assistant specialized in building energy audits. "
        "Extract information accurately and return valid JSON only."
    )

    try:
        # Call LLM
        print("Calling CBorg LLM for ECM extraction...")
        response = client.extract_with_prompt(
            system_prompt=system_msg,
            user_content=prompt,
            model=model,
            temperature=0.0,
        )

        # Parse JSON response
        json_str = _extract_json_from_response(response)
        extracted_data = json.loads(json_str)

        # Ensure array format
        if not isinstance(extracted_data, list):
            print("Note: LLM returned single object, converting to array")
            extracted_data = [extracted_data]

        if not extracted_data:
            print("Warning: LLM returned empty array")
            return []

        # Validate each ECM record
        validated_records = []
        for i, ecm_data in enumerate(extracted_data, start=1):
            try:
                record = ECMRecord.model_validate(ecm_data)
                ecm_name = record.ecm_detail.name
                print(f"✓ ECM {i}: {ecm_name}")
                validated_records.append(record)

            except ValidationError as e:
                print(f"✗ ECM {i} validation failed:")
                for error in e.errors():
                    field = " -> ".join(str(loc) for loc in error["loc"])
                    print(f"  {field}: {error['msg']}")
                continue

        print(f"\nSuccessfully extracted {len(validated_records)} ECM record(s)")
        return validated_records

    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse LLM response as JSON: {e}") from e
    except Exception as e:
        raise RuntimeError(f"ECM extraction failed: {e}") from e


def _extract_json_from_response(response: str) -> str:
    """Extract JSON content from LLM response.

    Handles various formats:
    - JSON wrapped in ```json code blocks
    - Plain JSON arrays/objects
    - Text with embedded JSON

    Args:
        response: Raw LLM response text

    Returns:
        Cleaned JSON string
    """
    json_str = response.strip()

    # Method 1: Extract from code blocks
    if "```json" in json_str:
        start_marker = json_str.find("```json") + 7
        end_marker = json_str.find("```", start_marker)
        if end_marker != -1:
            json_str = json_str[start_marker:end_marker].strip()
        else:
            json_str = json_str[start_marker:].strip()

    # Method 2: Extract from plain code blocks
    elif "```" in json_str:
        start_marker = json_str.find("```") + 3
        end_marker = json_str.find("```", start_marker)
        if end_marker != -1:
            json_str = json_str[start_marker:end_marker].strip()

    # Method 3: Find JSON array
    elif "[" in json_str:
        start_bracket = json_str.find("[")
        json_str = json_str[start_bracket:].strip()

    # Method 4: Find JSON object
    elif "{" in json_str:
        start_brace = json_str.find("{")
        json_str = json_str[start_brace:].strip()

    # Clean up trailing markers
    if json_str.endswith("```"):
        json_str = json_str[:-3].strip()

    return json_str
