import Dexie, { type EntityTable } from "dexie";

export interface FlowRecord {
    id: string;
    nodes: string; // JSON-serialized nodes array
    edges: string; // JSON-serialized edges array
    updatedAt: number;
}

const db = new Dexie("StoryFlowDB") as Dexie & {
    flows: EntityTable<FlowRecord, "id">;
};

db.version(1).stores({
    flows: "id, updatedAt",
});

export { db };
