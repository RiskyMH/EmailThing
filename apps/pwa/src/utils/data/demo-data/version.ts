export const DEMO_DATA_VERSION = 1; // Increment this when demo data changes

export interface DemoDataVersion {
    id: 'demo-version';
    version: number;
    lastUpdated: Date;
}

export const DEMO_VERSION_KEY = 'demo-version'; 