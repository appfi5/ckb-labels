import * as z from "zod";


export const udtSchema = z.object({
  "$schema": z.string(),
  name: z.string().min(1, { error: "Name is required" }).describe("UDT Name"),
  symbol: z.string().min(1, { error: "Symbol is required" }).max(20),
  icon: z.string().optional(),
  decimal: z.number().min(0).max(8),
  tags: z.array(z.enum(["rgb++", "layer-1-asset", "layer-2-asset", "supply-limited"])).optional(),
  manager: z.string().optional(),
  type: z.object({
    codeHash: z.string().min(1),
    hashType: z.enum(["type", "data", "data1", "data2"]),
    args: z.string().min(1)
  }),
  typeHash: z.string().min(1),
})