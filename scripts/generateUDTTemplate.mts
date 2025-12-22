
import { deprecate, parseArgs, type ParseArgsConfig } from "util";
import { Script, type ScriptLike } from "@ckb-ccc/core"
import fs from "fs";
import path from "path";
// command line parse: generateUDTTemplate --testnet [typehash] --mainnet [typehash]
const options: ParseArgsConfig['options'] = {
  name: {
    type: "string",
    default: "",
  },
  symbol: {
    type: "string",
    default: "",
  },
  decimal: {
    type: "string",
    default: "0",
  },
  testnet: {
    type: "string",
    default: "",
  },
  mainnet: {
    type: "string",
    default: "",
  },
};
const args = process.argv.slice(2);
const { values: params } = parseArgs({ args, options });

const testnetTypeHash = params.testnet as string;
const mainnetTypeHash = params.mainnet as string;

const apiUrl = {
  testnet: "https://testnet-api.explorer.app5.org/api/v1/udts/",
  mainnet: "https://mainnet-api.explorer.app5.org/api/v1/udts/",
};

async function fetchUDTScriptInfo(typeHash: string, network: "testnet" | "mainnet") {
  const url = apiUrl[network] + typeHash;
  const response = await fetch(url);
  const json = await response.json();
  const typeScriptResponse = (json as any).data.typeScriptResponse as ScriptLike;
  const script = {
    codeHash: typeScriptResponse.codeHash,
    hashType: typeScriptResponse.hashType,
    args: typeScriptResponse.args,
  }
  return script;
}

(async function main() {

  if(testnetTypeHash) {
    await generateUDTTemplateByNetwork(testnetTypeHash, "testnet");
  }
  if(mainnetTypeHash) {
    await generateUDTTemplateByNetwork(mainnetTypeHash, "mainnet");
  }
})()


async function generateUDTTemplateByNetwork(typeHash: string, network: "testnet" | "mainnet") {
  const script = await fetchUDTScriptInfo(typeHash, network);
  const symbol = params.symbol || params.name;
  const ouputJson = {
    "$schema": "../../schema.json",
    "name": params.name || "",
    "symbol": symbol || "",
    "icon": "",
    "decimal": +params.decimal!,
    "tags": [],
    "manager": "",
    "type": {
      "codeHash": script.codeHash,
      "hashType": script.hashType,
      "args": script.args
    },
    "typeHash": Script.from(script).hash(),
  }
  if (!symbol) {
    console.log(JSON.stringify(ouputJson, null, 2));
    return;
  }
  // folderName = paras.name to kebab-case
  const folderName = (symbol as string)
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/\+/g, 'p')
    .replace(/[^a-z0-9-]/g, '-');
  const targetPath = `./infomations/udt/${network}/${folderName}`;
  if (fs.existsSync(path.resolve(targetPath, "index.json"))) {
    throw new Error(`${targetPath} already exists`);
  }
  fs.mkdirSync(targetPath, { recursive: true });

  fs.writeFileSync(`${targetPath}/index.json`, JSON.stringify(ouputJson, null, 2));

  console.log(`${targetPath}/index.json generated`);
}