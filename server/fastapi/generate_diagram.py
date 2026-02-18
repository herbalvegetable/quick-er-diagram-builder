import os
from dotenv import load_dotenv
load_dotenv()

from pathlib import Path

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

from output_schemas import Attribute, Entity, Relationship, ERDiagram


# ---------------------------------------------------------------------------
#  Resolve the system prompt file path relative to this script
# ---------------------------------------------------------------------------
_SCRIPT_DIR = Path(__file__).resolve().parent
_SYSTEM_PROMPT_PATH = _SCRIPT_DIR / "system_prompt.txt"


# ---------------------------------------------------------------------------
#  Serialisation helpers — convert structured ERDiagram back to the
#  plain-text format that the webapp parser (extractCode.ts) expects.
# ---------------------------------------------------------------------------

def _serialize_attribute(attr: Attribute) -> str:
    """Serialise a single Attribute to its command-syntax string."""
    if attr.type == "primary":
        return f"u.{attr.name}"
    if attr.type == "partial":
        return f"du.{attr.name}"
    return attr.name


def _serialize_entity(entity: Entity) -> str:
    """Serialise a single Entity to its command-syntax line (without trailing ';')."""
    # Build the dot-separated header: name[.type[.opt1.opt2...]]
    # Omit the type token for strong entities (it is the default)
    header_parts = [entity.name]
    if entity.type != "strong":
        header_parts.append(entity.type)
    if entity.options:
        header_parts.extend(entity.options)
    header = ".".join(header_parts)

    # Build the comma-separated attribute list
    if entity.attrs:
        attrs_str = ", ".join(_serialize_attribute(a) for a in entity.attrs)
        return f"{header} {attrs_str}"
    return header


def _serialize_relationship(rel: Relationship) -> str:
    """Serialise a single Relationship to its command-syntax line (without trailing ';')."""
    tokens = [
        rel.entity_from,
        rel.cardinality_right_to_left,
        rel.name,
        rel.cardinality_left_to_right,
        rel.entity_to,
    ]
    if rel.line_type == "double":
        tokens.append("double")

    line = " ".join(tokens)

    # Append relationship attributes in curly braces if present
    if rel.attrs:
        rel_attrs_str = ", ".join(a.name for a in rel.attrs)
        line += f" {{{rel_attrs_str}}}"

    return line


def _serialize_er_diagram(diagram: ERDiagram) -> str:
    """Convert a structured ERDiagram object into the full plain-text format."""
    lines = ["entities:"]
    for entity in diagram.entities:
        lines.append(f"    {_serialize_entity(entity)};")

    lines.append("")  # blank line between blocks
    lines.append("relationships:")
    for rel in diagram.relationships:
        lines.append(f"    {_serialize_relationship(rel)};")

    # Trailing newline so the file always ends cleanly
    lines.append("    ")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
#  Main generation function
# ---------------------------------------------------------------------------

def generate_diagram(business_rules: str) -> str:
    """
    Accept plain-English business rules and return ER diagram code
    in the webapp's text format.

    Steps:
      1. Initialise the Gemini model with structured output (ERDiagram schema).
      2. Load the system prompt and build a ChatPromptTemplate.
      3. Pipe the prompt template into the structured LLM to form a chain.
      4. Invoke the chain with the user's business rules.
      5. Serialise the structured output back to the plain-text format.
      6. Return the diagram text.
    """

    # -- 1. Set up the Gemini model with structured output ----------------
    llm = ChatGoogleGenerativeAI(
        model="gemini-3-pro-preview",
        api_key=os.getenv('GOOGLE_API_KEY'),
        temperature=0,
    )
    structured_llm = llm.with_structured_output(ERDiagram)

    # -- 2. Load the system prompt and create a prompt template -----------
    system_prompt_raw = _SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")

    # Escape literal curly braces in the system prompt so LangChain does
    # not misinterpret them as template variables (e.g. "{attr1, attr2}").
    system_prompt = system_prompt_raw.replace("{", "{{").replace("}", "}}")

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{business_rules}"),
    ])

    # -- 3. Pipe the prompt into the structured LLM (chain) ---------------
    chain = prompt | structured_llm

    # -- 4. Invoke the chain with the user's business rules ---------------
    er_diagram: ERDiagram = chain.invoke({"business_rules": business_rules})

    # -- 5. Serialise and return the plain-text diagram -------------------
    return _serialize_er_diagram(er_diagram)
