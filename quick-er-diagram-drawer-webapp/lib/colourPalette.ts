export type ColourPalette = {
    id: string;
    name: string;
    background: string;
    entityStroke: string;
    entityText: string;
    entityFill: string;
    isFrosted?: boolean;
};

export const colourPalettes: ColourPalette[] = [
    {
        id: 'light-slate',
        name: 'Light Slate',
        background: '#F5F5F5',
        entityStroke: '#1F2933',
        entityText: '#111827',
        entityFill: '#FFFFFF',
    },
    {
        id: 'black-white',
        name: 'Black / White entities',
        background: 'black',
        entityStroke: 'white',
        entityText: 'white',
        entityFill: 'black',
    },
    {
        id: 'ink-amber',
        name: 'Ink & Amber',
        background: '#111827',
        entityStroke: '#F59E0B',
        entityText: '#F9FAFB',
        entityFill: '#1F2937',
    },
    {
        id: 'teal-deep',
        name: 'Deep Teal',
        background: '#0F766E',
        entityStroke: '#ECFEFF',
        entityText: '#E5FEFF',
        entityFill: '#134E4A',
    },
    {
        id: 'royal-purple',
        name: 'Royal Purple',
        background: '#1E1033',
        entityStroke: '#A855F7',
        entityText: '#E5E7EB',
        entityFill: '#2D1B4A',
    },
    {
        id: 'warm-sand',
        name: 'Warm Sand',
        background: '#FAF5E7',
        entityStroke: '#B91C1C',
        entityText: '#111827',
        entityFill: '#FFFFFF',
    },

    // additional frosted palettes
    {
        id: 'navy-frosted',
        name: 'Navy Frosted',
        background: '#020617',
        entityStroke: '#E5E7EB',
        entityText: '#F9FAFB',
        entityFill: 'rgba(15, 23, 42, 0.75)',
        isFrosted: true,
    },
    {
        id: 'sky-frosted',
        name: 'Sky Frosted',
        background: '#E0F2FE',
        entityStroke: '#1D4ED8',
        entityText: '#1E293B',
        entityFill: 'rgba(255, 255, 255, 0.55)',
        isFrosted: true,
    },
];

