export function capitaliseFirstLetter(inputString: string): string {
    if (!inputString) {
        return inputString; // Return empty or null strings as is
    }
    return inputString.charAt(0).toUpperCase() + inputString.slice(1);
}

export function prettyFormatVariableName(name: string): string {
    name = capitaliseFirstLetter(name);

    if (name.includes("_")) {
        name = name.split("_").map((word: string) => capitaliseFirstLetter(word)).join("_");
    }

    return name;
}