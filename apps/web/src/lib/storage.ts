// storage.ts: the vault file — header plus hash-chained encrypted log. Only ciphertext is ever stored
// or exported. Browser storage can be missing or throw, so every access is guarded.
import { z } from 'zod';
import {
  EncryptedRecordSchema,
  VaultHeaderSchema,
  type LogEntry,
  type VaultHeader,
} from '@audiorapy/domain';

const KEY = 'audiorapy.vault.v1';

const LogEntrySchema = z.object({
  seq: z.number().int().min(0),
  prevHash: z.string(),
  record: EncryptedRecordSchema,
  amends: z.number().int().min(0).optional(),
  hash: z.string(),
});

export const VaultFileSchema = z.object({
  format: z.literal('audiorapy-vault'),
  version: z.literal(1),
  header: VaultHeaderSchema,
  log: z.array(LogEntrySchema),
});

export interface VaultFile {
  format: 'audiorapy-vault';
  version: 1;
  header: VaultHeader;
  log: LogEntry[];
}

export function newVaultFile(header: VaultHeader): VaultFile {
  return { format: 'audiorapy-vault', version: 1, header, log: [] };
}

export function parseVaultFile(raw: unknown): VaultFile | null {
  const parsed = VaultFileSchema.safeParse(raw);
  return parsed.success ? (parsed.data as VaultFile) : null;
}

export function loadVault(
  storage: Pick<Storage, 'getItem'> | null = safeStorage(),
): VaultFile | null {
  try {
    const raw = storage?.getItem(KEY);
    return raw ? parseVaultFile(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveVault(
  file: VaultFile,
  storage: Pick<Storage, 'setItem'> | null = safeStorage(),
): boolean {
  try {
    storage?.setItem(KEY, JSON.stringify(file));
    return Boolean(storage);
  } catch {
    return false;
  }
}

export function clearVault(storage: Pick<Storage, 'removeItem'> | null = safeStorage()) {
  try {
    storage?.removeItem(KEY);
  } catch {
    /* storage unavailable: nothing to clear */
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
