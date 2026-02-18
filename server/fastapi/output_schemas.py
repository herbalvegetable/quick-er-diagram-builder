from typing import List, Literal, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
#  Attribute schema
#  Maps to the webapp's AttrType: { name: string, type?: string }
#
#  Command syntax reference:
#    Primary key  ->  u.<attr_name>        (type = "primary")
#    Partial key  ->  du.<attr_name>       (type = "partial")
#    Normal attr  ->  <attr_name>          (type = None / omitted)
#    Multi-valued ->  <attr_name>(v1?, v2?)  (type = None, name includes parens)
# ---------------------------------------------------------------------------

class Attribute(BaseModel):
    """A single attribute belonging to an entity or relationship."""

    name: str = Field(
        ...,
        description=(
            "The attribute name in snake_case. "
            "For primary keys, provide just the name without the 'u.' prefix. "
            "For partial keys, provide just the name without the 'du.' prefix. "
            "For multi-valued attributes, include the parenthesised values as "
            "part of the name, e.g. 'person_type(customer?, employee?)'."
        ),
    )
    type: Optional[Literal["primary", "partial"]] = Field(
        default=None,
        description=(
            "The attribute key type. "
            "'primary' = unique primary key (rendered as 'u.<name>' in command syntax). "
            "'partial' = discriminating partial key for weak entities "
            "(rendered as 'du.<name>' in command syntax). "
            "Omit or set to None for normal / multi-valued attributes."
        ),
    )


# ---------------------------------------------------------------------------
#  Entity schema
#  Maps to the webapp's EntityDataType:
#    { name: string, type: string, options?: string[], attrs?: AttrType[] }
#
#  Command syntax reference:
#    <entity_name>[.<type>[.<option1>.<option2>...]] <attributes>;
# ---------------------------------------------------------------------------

class Entity(BaseModel):
    """
    An entity in the ER diagram.

    The header is serialised as:  <name>.<type>[.<option1>.<option2>...]
    followed by a space-separated, comma-delimited attribute list, ending
    with a semicolon.
    """

    name: str = Field(
        ...,
        description=(
            "Entity name in snake_case (lowercase with underscores). "
            "Must be unique across all entities in the diagram."
        ),
    )
    type: Literal["strong", "weak", "assoc", "super", "sub"] = Field(
        ...,
        description=(
            "The entity type. "
            "'strong' = regular entity (default when no type suffix is given). "
            "'weak' = depends on an owner entity for identification; must have "
            "a 'du.' partial-key attribute and a 'double' relationship to its owner. "
            "'assoc' = associative entity representing a promoted M:N relationship "
            "that carries its own attributes. "
            "'super' = superclass entity; requires exactly two options "
            "[participation, disjointness] and the last attribute must be the "
            "discriminator. "
            "'sub' = subclass entity; requires exactly one option [parent_name] "
            "referencing its superclass."
        ),
    )
    options: Optional[List[str]] = Field(
        default=None,
        description=(
            "Additional dot-separated options after the type in the entity header. "
            "For 'super' entities: exactly two values — "
            "  [0] participation constraint: 'total' | 'partial', "
            "  [1] disjointness constraint: 'disjoint' | 'overlap'. "
            "For 'sub' entities: exactly one value — "
            "  [0] the name of the parent superclass entity. "
            "For all other types: omit or set to None."
        ),
    )
    attrs: Optional[List[Attribute]] = Field(
        default=None,
        description=(
            "List of attributes belonging to this entity. "
            "Strong and super entities must have exactly one 'primary' attribute. "
            "Weak entities must have exactly one 'partial' attribute. "
            "Sub entities list only their own additional attributes (the primary "
            "key is inherited from the superclass). "
            "For super entities the LAST attribute must be the discriminator: "
            "a plain attribute for disjoint, or a multi-valued attribute with "
            "'(subtype1?, subtype2?, ...)' syntax for overlap."
        ),
    )


# ---------------------------------------------------------------------------
#  Relationship schema
#  Maps to the webapp's RelDataType:
#    { name: string, type: string, arrows: RelArrowType[], attrs?: AttrType[] }
#
#  Command syntax reference (positional tokens):
#    <entity_from> <card_right_to_left> <rel_name> <card_left_to_right>
#        <entity_to> [line_type] [{attr1, attr2}];
# ---------------------------------------------------------------------------

class Relationship(BaseModel):
    """
    A relationship between two entities in the ER diagram.

    Serialised as:
      <entity_from> <cardinality_right_to_left> <name>
          <cardinality_left_to_right> <entity_to> [line_type];
    """

    entity_from: str = Field(
        ...,
        description=(
            "Name of the first (left) entity participating in this "
            "relationship. Must match an entity name defined in the "
            "entities list (case-insensitive)."
        ),
    )
    cardinality_right_to_left: Literal["11", "01", "0m", "1m"] = Field(
        ...,
        description=(
            "Cardinality from entity_to TOWARD entity_from "
            "(the second positional token in the command syntax). "
            "'11' = exactly one, '01' = zero or one, "
            "'1m' = one or many, '0m' = zero or many."
        ),
    )
    name: str = Field(
        ...,
        description=(
            "A short verb or phrase naming the relationship, in snake_case. "
            "For example: 'has', 'places', 'enrolled_in', 'treats'."
        ),
    )
    cardinality_left_to_right: Literal["11", "01", "0m", "1m"] = Field(
        ...,
        description=(
            "Cardinality from entity_from TOWARD entity_to "
            "(the fourth positional token in the command syntax). "
            "'11' = exactly one, '01' = zero or one, "
            "'1m' = one or many, '0m' = zero or many."
        ),
    )
    entity_to: str = Field(
        ...,
        description=(
            "Name of the second (right) entity participating in this "
            "relationship. Must match an entity name defined in the "
            "entities list (case-insensitive)."
        ),
    )
    line_type: Literal["single", "double"] = Field(
        default="single",
        description=(
            "The line style for this relationship. "
            "'double' = total participation (double line), used when a weak "
            "entity is connected to its identifying owner entity. "
            "'single' = normal / partial participation (default)."
        ),
    )
    attrs: Optional[List[Attribute]] = Field(
        default=None,
        description=(
            "Optional list of attributes that belong to this relationship "
            "itself (not to either entity). Serialised inside curly braces "
            "in the command syntax, e.g. {enrollment_date, grade}. "
            "Relationship attributes do not have key types — only names."
        ),
    )


# ---------------------------------------------------------------------------
#  Top-level ER Diagram schema
#  Maps to extractDiagramCode()'s return type:
#    { entities?: EntityDataType[], relationships?: RelDataType[] }
#
#  Serialised as the full diagram-code file with 'entities:' and
#  'relationships:' block headers.
# ---------------------------------------------------------------------------

class ERDiagram(BaseModel):
    """
    The complete ER diagram output containing all entities and relationships.

    Serialised as a plain-text file with two blocks:
        entities:
            <entity definitions>;
        relationships:
            <relationship definitions>;
    """

    entities: List[Entity] = Field(
        ...,
        description=(
            "List of all entities in the ER diagram. "
            "Superclass entities must appear before their subclass entities. "
            "Each entity name must be unique (case-insensitive). "
            "Do NOT include 'connector' type entities — those are generated "
            "internally by the webapp from super/sub definitions."
        ),
    )
    relationships: List[Relationship] = Field(
        default_factory=list,
        description=(
            "List of all relationships between entities. "
            "Do NOT include relationships for super/sub hierarchies — those "
            "are derived automatically from the entity definitions. "
            "Every weak entity must have exactly one 'double' relationship "
            "to its owner entity. Entity names referenced here must match "
            "entities defined in the entities list."
        ),
    )
