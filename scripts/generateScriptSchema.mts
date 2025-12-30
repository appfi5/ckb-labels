
import * as fs from "node:fs"
import z from "zod"
import { scriptSchema } from "./script.schema.mts"



const jsonSchema = z.toJSONSchema(scriptSchema);

fs.writeFileSync("./information/script/schema.json", JSON.stringify(jsonSchema, null, 2));
