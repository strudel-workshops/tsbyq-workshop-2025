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
- Return an array of JSON objects (even if only one ECM found)
- Each ECM should be a separate, complete ECMRecord object
- Include full building information in each record (repeated per ECM)
- This creates a "flat" structure where building data is denormalized across ECM records

SCHEMA (each ECM record in the array should match this):
```json
{schema_json}
```

EXTRACTION INSTRUCTIONS:
1. Identify ALL Energy Conservation Measures mentioned in the document.
2. For each ECM, create a complete ECMRecord object with:
   - The same building information repeated in each record.
   - Unique ECM details (name, status, costs, savings, etc.).
   - The same audit information if applicable.
3. Pay special attention to image descriptions (marked with ```<image-annotation>```).
4. Extract specific costs, savings, and implementation details for each ECM.
5. Use null for missing values, do not make up data.
6. Format every physical quantity as an object with keys "value" and "unit" (preserve decimals):
   - Energy savings fields (`annual_energy_savings`) - units: kBtu, MMBtu, Btu, kWh, MWh, GWh, therm, GJ.
   - Peak electric demand (`annual_demand_reduction`) - units: kW, MW, W, hp, ton.
   - Cost fields (`cost_estimate`, `annual_cost_savings`) - units: USD, CAD, EUR, GBP.
   - Area fields (`gross_floor_area`) - units: sf, m2, acre.
   - Time fields (`simple_payback`, `useful_life`) - units: year, month, week, day.
7. Normalize units to the canonical forms above (e.g., remove `/year` suffixes, use "sf" not "sqft") but do not change numeric values.
8. Follow schema constraints (enums, required fields, data types).

DOCUMENT:
```markdown
{markdown}
```

RESPONSE (Array of complete ECMRecord objects):"""

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
                ecm_name = record.ecm.name if record.ecm else "Unnamed ECM"
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
