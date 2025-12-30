
import * as fs from "node:fs"
import z from "zod"
import { udtSchema } from "./udt.schema.mts"



const jsonSchema = z.toJSONSchema(udtSchema);

fs.writeFileSync("./information/udt/schema.json", JSON.stringify(jsonSchema, null, 2));
