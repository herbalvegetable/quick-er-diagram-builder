export type AttrType = {
    name: string,
    type?: string,
}

// entity data object
export type EntityDataType = {
    name: string,
    type: string,
    options?: string[],
    attrs?: AttrType[],
}
// type: strong, weak, assoc, connector
// for connectors:
// options: <total | partial>,<disjoint | overlap>

export type RelArrowType = {
    from: string,
    to: string,
    cardinality: string,
}

// relationship data object
export type RelDataType = {
    name: string,
    type: string,
    arrows: RelArrowType[],
    attrs?: AttrType[],
    _startOffset?: number,
    _endOffset?: number,
}
// types: "single" | "double" | "singleHeadless" | "doubleHeadless"