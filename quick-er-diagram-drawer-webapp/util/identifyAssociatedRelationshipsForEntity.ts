import { EntityDataType, RelDataType } from "@/types";

/**
 * Given an entity and a list of relationships, returns the indices of all
 * relationships that reference this entity (by matching the entity's id in
 * either the `from` or `to` fields of any arrow in the relationship).
 *
 * The entity id is constructed the same way as in page.tsx:
 *   - connectors: "connector:<name>"
 *   - all others: "entity:<name>"
 */
export function identifyAssociatedRelationshipsForEntity(
    entity: EntityDataType,
    relationships: RelDataType[],
): number[] {
    const entityId = `${entity.type !== "connector" ? "entity" : "connector"}:${entity.name.toLowerCase()}`;

    const associatedIndices: number[] = [];

    for (let i = 0; i < relationships.length; i++) {
        const rel = relationships[i];
        const isAssociated = rel.arrows.some(
            (arrow) =>
                arrow.from.toLowerCase() === entityId ||
                arrow.to.toLowerCase() === entityId
        );
        if (isAssociated) {
            associatedIndices.push(i);
        }
    }

    return associatedIndices;
}

/**
 * For a super entity, find the index of its associated connector entity
 * in the entities list. The connector shares the same name but has type "connector".
 *
 * Returns the index, or -1 if not found.
 */
export function identifyAssociatedConnectorForSuperEntity(
    superEntity: EntityDataType,
    entities: EntityDataType[],
): number {
    if (superEntity.type !== 'super') return -1;

    const targetName = superEntity.name.toLowerCase();
    return entities.findIndex(
        (e) => e.type === 'connector' && e.name.toLowerCase() === targetName
    );
}

/**
 * Collect ALL relationship indices associated with a given entity,
 * AND — if the entity is a super — also those associated with its connector.
 *
 * Returns a deduplicated array of relationship indices.
 */
export function identifyAllRelationshipsForEntityDeletion(
    entity: EntityDataType,
    entities: EntityDataType[],
    relationships: RelDataType[],
): number[] {
    const indices = new Set<number>(
        identifyAssociatedRelationshipsForEntity(entity, relationships)
    );

    // If this is a super entity, also collect rels tied to its connector
    if (entity.type === 'super') {
        const connectorIdx = identifyAssociatedConnectorForSuperEntity(entity, entities);
        if (connectorIdx !== -1) {
            const connector = entities[connectorIdx];
            for (const idx of identifyAssociatedRelationshipsForEntity(connector, relationships)) {
                indices.add(idx);
            }
        }
    }

    return Array.from(indices);
}
