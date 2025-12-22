import z from "zod";


const deploymentSchema = z.object({
  tag: z.string().optional().describe("tag for multi deployments, eg. v1, v2, @0000"),
  deprecated: z.boolean(),
  hashType: z.enum(["type", "data", "data1", "data2"]),
  dataHash: z.string(),
  typeHash: z.string(),
  codeHash: z.string().min(1),
  cellDeps: z.array(z.any()).describe("cellDeps is not validate yet"),
  outPoint: z.object({
    txHash: z.string().min(1),
    index: z.number(),
  }).optional()

})


export const scriptSchema = z.object({
  "$schema": z.string(),
  name: z.string().min(1, { error: "Name is required" }).describe("Script Name"),
  description: z.string(),
  rfc: z.string(),
  website: z.string(),
  sourceUrl: z.string(),
  decoderType: z.enum([
    "udt",
    "spore",
    "spore-cluster",
    "dao",
    "ckbfs"
  ]).optional().describe("Type for cell decoder"),
  deployments: z.object({
    mainnet: z.array(deploymentSchema),
    testnet: z.array(deploymentSchema),
  })
})