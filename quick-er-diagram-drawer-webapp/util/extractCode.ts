import { EntityDataType, RelDataType } from "@/types";

import { capitaliseFirstLetter, prettyFormatVariableName } from "./strings";

export function extractEntityCode(codeStr: string): EntityDataType {
    let entity: EntityDataType = { name: '', type: '' };

    codeStr = codeStr.trim();
    if (!codeStr) {
        throw new Error('Entity command is empty. Expected something like: "User.strong u.id, name".');
    }

    let [header, attrStr] = codeStr.split(/\s+(.*)/);
    if (!header) {
        throw new Error(`Missing entity name at the start of: "${codeStr}".`);
    }

    let headerProps = header.split(".");

    // let nameMatch = codeStr.match(/^\S+/);
    // // console.log(codeStr, nameMatch);
    // if (nameMatch == null) {
    //     throw new Error("Error: Entity name not found");
    // }
    entity.name = headerProps[0].toLowerCase();

    let options = headerProps.slice(1);
    if (options.length > 0) {
        // console.log('Options: ', options);
        entity.type = options[0];
        entity.options = options.slice(1).map((option: string, i: number) => {
            return option.trim();
        });
    }
    else {
        entity.type = "strong";
    }

    if (attrStr) {
        let attrs = attrStr.split(/,\s*(?![^()]*\))/g);
        // console.log("Attrs:", attrs);
        entity.attrs = attrs.map((attr: string, i: number) => {
            let identifiers = ["u.", "du."];
            let types = ['primary', 'partial'];
            attr = attr.trim();

            for (let i = 0; i < identifiers.length; i++) {
                if (attr.startsWith(identifiers[i])) {
                    let name = attr.split(".")[1];
                    // console.log("Attr name: ", name, identifiers[i]);

                    return {
                        type: types[i],
                        name: prettyFormatVariableName(name),
                    }
                }
            }

            return { name: prettyFormatVariableName(attr) };
        });
    }
    else {
        entity.attrs = [];
    }

    console.log("Entity: ", entity);
    return entity;
}

export function extractRelationshipCode(codeStr: string): RelDataType {
    let relData: RelDataType = { name: "", type: "single", arrows: [] };

    codeStr = codeStr.trim();
    if (!codeStr) {
        throw new Error('Relationship command is empty. Expected: "<from> <card_to_from> <name> <card_from_to> <to> [type]".');
    }

    let relMatch = codeStr.match(/[^{]+/);
    if (relMatch == null) {
        throw new Error("Error: relationship code not found");
    }
    let relStr = relMatch[0].trim();
    let relSplit = relStr.split(/\s+/);
    
    if (relSplit.length < 5) {
        throw new Error(
            `Relationship command is incomplete near "${relStr}". ` +
            'Expected: "<from> <card_to_from> <name> <card_from_to> <to> [type]".'
        );
    }

    relData.name = relSplit[2];

    relData.type = relSplit[5] ?? "single"; // "single" or "double"

    // Ensure from/to always carry the "entity:" prefix.
    // User commands always target entities (connectors are internal-only).
    const fromId = relSplit[0].startsWith("entity:") || relSplit[0].startsWith("connector:")
        ? relSplit[0].toLowerCase()
        : `entity:${relSplit[0].toLowerCase()}`;
    const toId = relSplit[4].startsWith("entity:") || relSplit[4].startsWith("connector:")
        ? relSplit[4].toLowerCase()
        : `entity:${relSplit[4].toLowerCase()}`;

    relData.arrows = [];
    relData.arrows[0] = { from: fromId, to: toId, cardinality: relSplit[3] };
    relData.arrows[1] = { from: toId, to: fromId, cardinality: relSplit[1] };

    let attrMatch = codeStr.match(/(?<=\{).*?(?=\})/);
    if (attrMatch != null) {
        let attrStr = attrMatch[0];
        let attrs = attrStr.split(",");
        relData.attrs = attrs.map((attr: string, i: number) => {
            return { name: attr.trim() };
        });
    }

    return relData;
}

type ExtractDiagramCodeReturnType = { entities?: EntityDataType[], relationships?: RelDataType[] };

export function extractDiagramCode(fileContent: string): ExtractDiagramCodeReturnType {
    try {
        let data: ExtractDiagramCodeReturnType = { entities: [], relationships: [] };

        let entityCodeMatch = fileContent.match(/(?<=entities:)([\s\S]*?)(?=\n\s*[a-zA-Z0-9_]+:)/);
        console.log(entityCodeMatch);
        if (entityCodeMatch != null) {
            let entityCodeContent = entityCodeMatch[0];
            let entityCode = entityCodeContent.split(";").slice(0, -1);
            const seenNames = new Set<string>();
            data.entities = [];
            for (const codeStr of entityCode) {
                const entity = extractEntityCode(codeStr.trim());
                const key = entity.name.toLowerCase();
                if (seenNames.has(key)) {
                    console.warn(`Duplicate entity "${entity.name}" ignored.`);
                    continue;
                }
                seenNames.add(key);
                data.entities.push(entity);
            }
        }

        let relCodeMatch = fileContent.match(/(?<=relationships:)\s*([\s\S]*)/);
        if (relCodeMatch != null) {
            let relCodeContent = relCodeMatch[0];
            let relCode = relCodeContent.split(";").slice(0, -1);
            data.relationships = relCode.map((codeStr: string, i: number): RelDataType => {
                return extractRelationshipCode(codeStr.trim());
            });
        }

        return data;
    }
    catch (err) {
        console.error('Error while extracting diagram code:', err);
        return { entities: [], relationships: [] };
    }
}

export function promptGenerateDiagramModel(rulesText: string): Promise<ExtractDiagramCodeReturnType> {
    return fetch('http://localhost:5000/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rulesText }),
    })
        .then((res) => {
            if (!res.ok) {
                throw new Error(`Server responded with status ${res.status}`);
            }
            return res.json();
        })
        .then((data: { output: string }) => {
            const parsed = extractDiagramCode(data.output);
            return parsed;
        })
        .catch((err) => {
            console.error('Error generating diagram from AI:', err);
            throw err;
        });
}

/**
 * Converts the current entitiesData and relsData back into diagram code text
 * with "entities:" and "relationships:" headers that extractDiagramCode can parse.
 */
export function createDiagramCode(
    entitiesData: EntityDataType[],
    relsData: RelDataType[],
): string {
    let lines: string[] = [];

    lines.push('entities:');
    for (const entity of entitiesData) {
        // Skip connector entities — they are auto-generated from super entities
        if (entity.type === 'connector') continue;

        let code = entity.name.toLowerCase();

        // Append type if not the default "strong"
        if (entity.type && entity.type !== 'strong') {
            code += `.${entity.type}`;
        }

        // Append options (e.g. total.disjoint for super entities)
        if (entity.options && entity.options.length > 0) {
            code += '.' + entity.options.join('.');
        }

        // Append attributes
        if (entity.attrs && entity.attrs.length > 0) {
            const attrStrs = entity.attrs.map((attr) => {
                if (attr.type === 'primary') return `u.${attr.name}`;
                if (attr.type === 'partial') return `du.${attr.name}`;
                return attr.name;
            });
            code += ' ' + attrStrs.join(', ');
        }

        lines.push(code + ';');
    }

    lines.push('relationships:');
    for (const rel of relsData) {
        // Skip auto-generated super/sub connector relationships (headless types)
        if (rel.type === 'singleHeadless' || rel.type === 'doubleHeadless') continue;

        const arrow0 = rel.arrows[0];
        const arrow1 = rel.arrows[1];

        // Strip "entity:" or "connector:" prefix for the code output
        const from = arrow0.from.replace(/^(entity:|connector:)/, '');
        const to = arrow0.to.replace(/^(entity:|connector:)/, '');

        // Format: <from> <card_to_from> <name> <card_from_to> <to> [type]
        let code = `${from} ${arrow1.cardinality} ${rel.name} ${arrow0.cardinality} ${to}`;

        if (rel.type && rel.type !== 'single') {
            code += ` ${rel.type}`;
        }

        // Append attributes if any
        if (rel.attrs && rel.attrs.length > 0) {
            const attrStrs = rel.attrs.map((a) => a.name);
            code += ` {${attrStrs.join(', ')}}`;
        }

        lines.push(code + ';');
    }

    return lines.join('\n');
}

export function interpretCommand(commandStr: string): { objType: string, obj: EntityDataType | RelDataType | null } {
    const trimmed = commandStr.trim();
    console.log('Command: ', trimmed);

    if (!trimmed) {
        throw new Error('Command is empty. Start with "!en" or "!rel" followed by the details.');
    }

    let [prefixRaw, codeStrRaw] = trimmed.split(/\s+(.*)/);
    // split into 2 parts: command prefix and rest of string
    let prefix = prefixRaw.replaceAll("!", '');
    const codeStr = (codeStrRaw ?? '').trim();

    if (!codeStr) {
        throw new Error(`No details provided after command "${prefixRaw}". Add the entity/relationship definition after the command.`);
    }

    console.log('Codestr: ', codeStr);

    let objType = 'null';
    let obj: EntityDataType | RelDataType | null;
    switch (prefix) {
        case 'en':
            objType = 'entity';
            obj = extractEntityCode(codeStr);
            break;
        case 'rel':
            objType = 'relationship';
            obj = extractRelationshipCode(codeStr);
            break;
        default:
            throw new Error(`Unknown command prefix "${prefixRaw}". Use "!en" for entities or "!rel" for relationships.`);
    }

    return { objType, obj };
}