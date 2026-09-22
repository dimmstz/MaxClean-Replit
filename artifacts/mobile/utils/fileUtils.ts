/**
 * fileUtils — Utilitários para operações de arquivo no MaxClean.
 *
 * NOTA DE SEGURANÇA: Nunca exclui arquivos do sistema Android,
 * pastas OBB, /data protegido ou qualquer arquivo crítico do SO.
 * Somente exclui o que o usuário confirmar explicitamente.
 *
 * LIMITAÇÃO DO ANDROID: Apps sem root não conseguem limpar o cache
 * interno de outros apps (bloqueado desde Android 6.0).
 * A função openAppSettings() direciona o usuário para as
 * configurações do app onde pode limpar manualmente.
 */
// expo-file-system v57 moved the legacy API — import from the legacy sub-path
// so we keep getInfoAsync / readDirectoryAsync / cacheDirectory etc. working.
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/** Retorna true se o caminho é seguro para exclusão */
function isSafeToDelete(path: string): boolean {
  const forbidden = [
    '/Android/obb/',
    '/data/data/',
    '/system/',
    '/proc/',
    '/sys/',
    '/dev/',
    '/sbin/',
    '/bin/',
    '/etc/',
    '/vendor/',
    '.nomedia',
  ];
  const lower = path.toLowerCase();
  return !forbidden.some((f) => lower.includes(f));
}

export interface ScannedFile {
  uri: string;
  name: string;
  size: number;
  modificationTime?: number;
  isDirectory: boolean;
  path: string;
  category: FileCategory;
}

export type FileCategory =
  | 'cache'
  | 'temp'
  | 'log'
  | 'apk'
  | 'zip'
  | 'large'
  | 'empty_folder'
  | 'download'
  | 'residual'
  | 'thumbnail'
  | 'other';

/** Determina categoria do arquivo pela extensão */
function categorize(name: string, size: number, isDir: boolean): FileCategory {
  if (isDir) return 'empty_folder';
  const lower = name.toLowerCase();
  if (lower.endsWith('.tmp') || lower.endsWith('.temp')) return 'temp';
  if (lower.endsWith('.log')) return 'log';
  if (lower.endsWith('.apk')) return 'apk';
  if (lower.endsWith('.zip') || lower.endsWith('.rar') || lower.endsWith('.7z'))
    return 'zip';
  if (lower.includes('thumb') || lower.includes('thumbnail')) return 'thumbnail';
  if (lower.endsWith('.bak') || lower.endsWith('.old')) return 'residual';
  if (lower.includes('/cache/') || lower.includes('/.cache/')) return 'cache';
  if (size > 100 * 1024 * 1024) return 'large';
  return 'other';
}

/** Prefixos das extensões temporárias / inúteis que buscamos */
const JUNK_EXTENSIONS = ['.tmp', '.temp', '.log', '.bak', '.old', '.dmp', '.crash'];
const APK_EXTENSIONS = ['.apk'];
const ARCHIVE_EXTENSIONS = ['.zip', '.rar', '.7z', '.tar', '.gz'];

/**
 * Escaneia um diretório recursivamente até maxDepth.
 * Retorna lista de arquivos encontrados.
 */
export async function scanDirectory(
  dirUri: string,
  options: {
    maxDepth?: number;
    minSize?: number;
    extensions?: string[];
    includeEmpty?: boolean;
  } = {}
): Promise<ScannedFile[]> {
  if (Platform.OS === 'web') return [];

  const {
    maxDepth = 3,
    minSize = 0,
    extensions,
    includeEmpty = false,
  } = options;

  const results: ScannedFile[] = [];

  async function walk(uri: string, depth: number) {
    if (depth > maxDepth) return;

    let entries: string[] = [];
    try {
      entries = await FileSystem.readDirectoryAsync(uri);
    } catch {
      return; // sem permissão ou não existe
    }

    // Pasta vazia
    if (includeEmpty && entries.length === 0 && depth > 0) {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists && !(info as any).isDirectory) return;
      results.push({
        uri,
        name: uri.split('/').pop() ?? '',
        size: 0,
        isDirectory: true,
        path: uri,
        category: 'empty_folder',
      });
      return;
    }

    for (const entry of entries) {
      const fullUri = uri.endsWith('/') ? uri + entry : uri + '/' + entry;

      if (!isSafeToDelete(fullUri)) continue;

      let info: FileSystem.FileInfo;
      try {
        info = await FileSystem.getInfoAsync(fullUri);
      } catch {
        continue;
      }

      if (!info.exists) continue;

      if (info.isDirectory) {
        await walk(fullUri, depth + 1);
      } else {
        const size = (info as any).size ?? 0;
        if (size < minSize) continue;

        const nameLower = entry.toLowerCase();
        if (extensions) {
          const hasExt = extensions.some((ext) => nameLower.endsWith(ext));
          if (!hasExt) continue;
        }

        const cat = categorize(entry, size, false);
        results.push({
          uri: fullUri,
          name: entry,
          size,
          modificationTime: (info as any).modificationTime,
          isDirectory: false,
          path: fullUri,
          category: cat,
        });
      }
    }
  }

  await walk(dirUri, 0);
  return results;
}

/**
 * Escaneia pastas acessíveis em busca de arquivos de lixo.
 * Retorna lista categorizada de arquivos encontrados.
 */
export async function scanForJunk(): Promise<ScannedFile[]> {
  if (Platform.OS === 'web') return getMockJunkFiles();

  const base = FileSystem.documentDirectory;
  if (!base) return [];

  // Extrai o prefixo para chegar ao armazenamento externo
  // ex: file:///data/user/0/com.xxx/documents/ → buscar em Downloads, etc.
  const downloadDir = FileSystem.cacheDirectory ?? base;

  const results: ScannedFile[] = [];

  // Escaneia cache do próprio app
  try {
    const cacheFiles = await scanDirectory(
      FileSystem.cacheDirectory ?? base,
      { maxDepth: 5, extensions: [...JUNK_EXTENSIONS, ...ARCHIVE_EXTENSIONS, ...APK_EXTENSIONS] }
    );
    results.push(...cacheFiles);
  } catch {}

  // Escaneia documentos do próprio app
  try {
    const docFiles = await scanDirectory(
      FileSystem.documentDirectory ?? base,
      { maxDepth: 3, extensions: [...JUNK_EXTENSIONS] }
    );
    results.push(...docFiles);
  } catch {}

  return results;
}

/** Exclui um arquivo de forma segura, verificando se é permitido */
export async function safeDelete(uri: string): Promise<boolean> {
  if (!isSafeToDelete(uri)) {
    console.warn('[MaxClean] Exclusão bloqueada por segurança:', uri);
    return false;
  }
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
    return true;
  } catch (err) {
    console.warn('[MaxClean] Erro ao excluir:', uri, err);
    return false;
  }
}

/** Exclui vários arquivos, retorna quantos foram excluídos */
export async function deleteFiles(
  uris: string[]
): Promise<{ deleted: number; failed: number; deletedUris: string[] }> {
  let deleted = 0;
  let failed = 0;
  const deletedUris: string[] = [];
  for (const uri of uris) {
    const ok = await safeDelete(uri);
    if (ok) {
      deleted++;
      deletedUris.push(uri);
    }
    else failed++;
  }
  return { deleted, failed, deletedUris };
}

/** Retorna tamanho total do cache do próprio app */
export async function getOwnCacheSize(): Promise<number> {
  if (Platform.OS === 'web') return 0;
  try {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) return 0;
    const info = await FileSystem.getInfoAsync(cacheDir);
    return (info as any).size ?? 0;
  } catch {
    return 0;
  }
}

/** Limpa cache do próprio app */
export async function clearOwnCache(): Promise<number> {
  if (Platform.OS === 'web') return 0;
  const before = await getOwnCacheSize();
  try {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) return 0;
    const entries = await FileSystem.readDirectoryAsync(cacheDir);
    for (const entry of entries) {
      const uri = cacheDir + entry;
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
    return before;
  } catch {
    return 0;
  }
}

// ── Mock data para web preview ──────────────────────────────────────────────

function getMockJunkFiles(): ScannedFile[] {
  return [
    { uri: 'mock://cache1', name: 'cache_data_2024.tmp', size: 48 * 1024 * 1024, isDirectory: false, path: '/cache/cache_data_2024.tmp', category: 'cache', modificationTime: Date.now() - 86400000 * 3 },
    { uri: 'mock://log1', name: 'app_crash.log', size: 12 * 1024 * 1024, isDirectory: false, path: '/logs/app_crash.log', category: 'log', modificationTime: Date.now() - 86400000 * 10 },
    { uri: 'mock://apk1', name: 'instagram_update_old.apk', size: 64 * 1024 * 1024, isDirectory: false, path: '/Download/instagram_update_old.apk', category: 'apk', modificationTime: Date.now() - 86400000 * 30 },
    { uri: 'mock://tmp1', name: 'temp_encode_1920x1080.tmp', size: 24 * 1024 * 1024, isDirectory: false, path: '/cache/temp_encode_1920x1080.tmp', category: 'temp', modificationTime: Date.now() - 86400000 },
    { uri: 'mock://zip1', name: 'backup_photos_jan.zip', size: 256 * 1024 * 1024, isDirectory: false, path: '/Download/backup_photos_jan.zip', category: 'zip', modificationTime: Date.now() - 86400000 * 60 },
    { uri: 'mock://thumb1', name: '.thumbnails_dcim', size: 38 * 1024 * 1024, isDirectory: false, path: '/DCIM/.thumbnails_dcim', category: 'thumbnail', modificationTime: Date.now() - 86400000 * 5 },
    { uri: 'mock://bak1', name: 'contacts_backup.bak', size: 8 * 1024 * 1024, isDirectory: false, path: '/Download/contacts_backup.bak', category: 'residual', modificationTime: Date.now() - 86400000 * 120 },
    { uri: 'mock://log2', name: 'system_metrics.log', size: 18 * 1024 * 1024, isDirectory: false, path: '/logs/system_metrics.log', category: 'log', modificationTime: Date.now() - 86400000 * 7 },
  ];
}
