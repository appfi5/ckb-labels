// node -r ts-node/register parse_output_script_mainnet.ts
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Address } = require('@ckb-ccc/core');

type RowObject = Record<string, string>;

interface OutputJson {
  id: number;
  tx_hash: string;
  index: number;
  data_size: number;
  data_hash: string;
  type_hash: string;
  lock_hash: string;
  owner_address: string;
  deploy_block_number: number;
  deploy_time: string | null;
  is_spent: boolean;
  consumed_tx_hash: string;
  consumed_block_number: number | null;
  consumed_time: string | null;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function toNumberOrNull(v: string): number | null {
  if (v === undefined || v === '' || v === '-1') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatUTC(msStr: string): string | null {
  const n = toNumberOrNull(msStr);
  if (n === null) return null;
  const d = new Date(n);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function normalizeHexPrefix(s: string): string {
  if (!s) return s;
  if (s.startsWith('\\x')) return '0x' + s.slice(2);
  return s;
}

function resolveHashType(ht: string | number): string {
  if (ht === 1 || ht === '1' || ht === 'type') return 'type';
  if (ht === 0 || ht === '0' || ht === 'data') return 'data';
  if (ht === 2 || ht === '2' || ht === 'data1') return 'data1';
  if (ht === 4 || ht === '4' || ht === 'data2') return 'data2';
  return String(ht || '').toLowerCase() || 'type';
}

async function main() {
  const csvPath = path.resolve(
    process.cwd(),
    'information/scripts_mainnet/20251224-output-script-mainnet.csv',
  );
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }

  const liveOutDir = path.resolve(process.cwd(), 'information/scripts_mainnet/live');
  await fs.promises.mkdir(liveOutDir, { recursive: true });
  const historyOutDir = path.resolve(
    process.cwd(),
    'information/scripts_mainnet/history',
  );
  await fs.promises.mkdir(historyOutDir, { recursive: true });

  const stream = fs.createReadStream(csvPath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let headers: string[] | null = null;
  let lineNum = 0;

  for await (const rawLine of rl) {
    lineNum++;
    const line = rawLine.trimEnd();
    if (line === '') continue;
    const cols = splitCSVLine(line);
    if (!headers) {
      headers = cols.map((h) => h.trim());
      continue;
    }
    const obj: RowObject = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]!] = cols[i] ?? '';
    }

    const id = obj['id'];
    if (!id) {
      continue;
    }

    const data_hash = normalizeHexPrefix(obj['data_hash'] ?? '');
    const type_hash = normalizeHexPrefix(obj['type_script_hash'] ?? '');
    const out: OutputJson = {
      id: Number(id || 0),
      tx_hash: normalizeHexPrefix(obj['tx_hash'] ?? ''),
      index: Number(obj['output_index'] || 0),
      data_size: Number(obj['data_size'] || 0),
      data_hash: data_hash,
      type_hash: type_hash,
      lock_hash: normalizeHexPrefix(obj['lock_script_hash'] ?? ''),
      owner_address: Address.from({
        script: {
          codeHash: normalizeHexPrefix(obj['lock_code_hash'] ?? ''),
          hashType: resolveHashType(obj['lock_hash_type'] ?? ''),
          args: normalizeHexPrefix(obj['lock_args'] ?? ''),
        },
        prefix: 'ckb',
      }).toString(),
      deploy_block_number: Number(obj['block_number'] || 0),
      deploy_time: formatUTC(obj['block_timestamp'] ?? ''),
      is_spent: Number(obj['is_spent'] || 0) === 1,
      consumed_tx_hash: normalizeHexPrefix(obj['consumed_tx_hash'] ?? ''),
      consumed_block_number: toNumberOrNull(obj['consumed_block_number'] ?? ''),
      consumed_time: formatUTC(obj['consumed_timestamp'] ?? ''),
    };

    if (out.is_spent) {
      const historyFilePath = path.join(historyOutDir, `${id}.json`);
      await fs.promises.writeFile(historyFilePath, JSON.stringify(out, null, 2), 'utf-8');
    } else {
      const filePath = path.join(liveOutDir, `${id}.json`);
      await fs.promises.writeFile(filePath, JSON.stringify(out, null, 2), 'utf-8');
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
