import indexJson from "./schema/index.json";
import type { SchemaIndex } from "./types";

/** The exported Payload schema index (sidebar groups, collection summaries). Plain data, safe in server and client code. */
export const schemaIndex = indexJson as unknown as SchemaIndex;
