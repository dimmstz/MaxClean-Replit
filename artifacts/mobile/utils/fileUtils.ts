/**
 * Utilitários de leitura e exclusão para o MaxClean.
 *
 * O app só pode apagar arquivos que o sistema disponibiliza para ele. No
 * Android isso inclui os diretórios públicos acessíveis e os ativos liberados
 * pela MediaLibrary; arquivos de sistema e de outros apps continuam fora do
 * escopo por segurança.
 */
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

const PUBLIC_ROOTS = [
  'file:///storage/emulated/0/Download',
  'file:///storage/emulated/0/Movies',
  'file:///storage/emulated/0/DCIM',
  'file:///storage/emulated/0/Pictures',
  'file:///storage/emulated/0/Music',
  'file:///storage/emulated/0/Documents',
];

const JUNK_EXTENSIONS = ['.tmp', '.temp', '.log', '.bak', '.old', '.dmp', '.crash'];
const ARCHIVE_EXTENSIONS = ['.zip', '.rar', '.7z', '.tar', '.gz'];
const APK_EXTENSIONS = ['.apk'];
const MEDIA_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif',
  '.mp4', '.mov', '.mkv', '.avi', '.3gp', '.mp3', '.m4a', '.wav',
];

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

export type FileScanMode =
  | 'junk'
  | 'duplicates'
  | 'large-files'
  | 'downloads'
  | 'empty-folders'
  | 'apk';

export interface ScannedFile {
  uri: string;
  name: string;
  size: number;
  modificationTime?: number;
  isDirectory: boolean;
  path: string;
  category: FileCategory;
  mediaAssetId?: string;
}

export class FileAccessError extends Error {
  code = 'permission-denied' as const;

  constructor() {
    super('Storage or media permission was denied');
    this.name = 'FileAccessError';
  }
}

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
  return !forbidden.some((part) => lower.includes(part));
}

function categorize(name: string, size: number, isDirectory: boolean): FileCategory {
  if (isDirectory) return 'empty_folder';
  const lower = name.toLowerCase();
  if (lower.endsWith('.tmp') || lower.endsWith('.temp')) return 'temp';
  if (lower.endsWith('.log')) return 'log';
  if (lower.endsWith('.apk')) return 'apk';
  if (ARCHIVE_EXTENSIONS.some((extension) => lower.endsWith(extension))) return 'zip';
  if (lower.includes('thumb') || lower.includes('thumbnail')) return 'thumbnail';
  if (lower.endsWith('.bak') || lower.endsWith('.old')) return 'residual';
  if (lower.includes('/cache/') || lower.includes('/.cache/')) return 'cache';
  if (size > 100 * 1024 * 1024) return 'large';
  return 'other';
}

export function getFileKind(name: string): 'apk' | 'zip' | 'pdf' | 'video' | 'photo' | 'doc' | 'other' {
  const lower = name.toLowerCase();
  if (lower.endsWith('.apk')) return 'apk';
  if (ARCHIVE_EXTENSIONS.some((extension) => lower.endsWith(extension))) return 'zip';
  if (lower.endsWith('.pdf')) return 'pdf';
  if (['.mp4', '.mov', '.mkv', '.avi', '.3gp'].some((extension) => lower.endsWith(extension))) return 'video';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'].some((extension) => lower.endsWith(extension))) return 'photo';
  if (['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'].some((extension) => lower.endsWith(extension))) return 'doc';
  return 'other';
}

export interface FileScanOutput {
  files: ScannedFile[];
  mediaAccess: 'all' | 'limited' | null;
}

interface MediaAccess {
  access: 'all' | 'limited';
  includeAudio: boolean;
}

async function ensureMediaPermission(): Promise<MediaAccess> {
  const visualTypes: MediaLibrary.GranularPermission[] = ['photo', 'video'];
  const current = await MediaLibrary.getPermissionsAsync(false, visualTypes);
  const visualPermission =
    current.granted || current.accessPrivileges === 'limited'
      ? current
      : await MediaLibrary.requestPermissionsAsync(false, visualTypes);

  if (!visualPermission.granted && visualPermission.accessPrivileges !== 'limited') {
    throw new FileAccessError();
  }

  let includeAudio = false;
  if (Platform.OS === 'android') {
    try {
      const currentAudio = await MediaLibrary.getPermissionsAsync(false, ['audio']);
      const audioPermission = currentAudio.granted || !currentAudio.canAskAgain
        ? currentAudio
        : await MediaLibrary.requestPermissionsAsync(false, ['audio']);
      includeAudio = audioPermission.granted;
    } catch (error) {
      // Áudio é opcional: sua recusa não deve bloquear fotos/vídeos autorizados.
      console.warn('[MaxClean] Permissão de áudio indisponível:', error);
    }
  }

  return {
    access: visualPermission.accessPrivileges === 'limited' ? 'limited' : 'all',
    includeAudio,
  };
}

/**
 * Escaneia um diretório recursivamente. Falhas em subdiretórios individuais
 * são ignoradas porque o Android pode bloquear apenas uma pasta específica.
 */
export async function scanDirectory(
  dirUri: string,
  options: {
    maxDepth?: number;
    minSize?: number;
    extensions?: string[];
    includeEmpty?: boolean;
  } = {},
): Promise<ScannedFile[]> {
  if (Platform.OS === 'web') return [];

  const { maxDepth = 3, minSize = 0, extensions, includeEmpty = false } = options;
  const results: ScannedFile[] = [];

  async function walk(uri: string, depth: number) {
    if (depth > maxDepth || !isSafeToDelete(uri)) return;

    let entries: string[];
    try {
      entries = await FileSystem.readDirectoryAsync(uri);
    } catch {
      return;
    }

    if (includeEmpty && entries.length === 0 && depth > 0) {
      results.push({
        uri,
        name: uri.split('/').filter(Boolean).pop() ?? uri,
        size: 0,
        isDirectory: true,
        path: uri,
        category: 'empty_folder',
      });
      return;
    }

    for (const entry of entries) {
      const fullUri = uri.endsWith('/') ? uri + entry : `${uri}/${entry}`;
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
        continue;
      }

      const size = (info as any).size ?? 0;
      const lowerName = entry.toLowerCase();
      if (size < minSize) continue;
      if (extensions && !extensions.some((extension) => lowerName.endsWith(extension))) continue;

      results.push({
        uri: fullUri,
        name: entry,
        size,
        modificationTime: (info as any).modificationTime,
        isDirectory: false,
        path: fullUri,
        category: categorize(entry, size, false),
      });
    }
  }

  await walk(dirUri, 0);
  return results;
}

async function scanMediaAssets(includeAudio: boolean): Promise<ScannedFile[]> {
  if (Platform.OS === 'web') return [];

  const page = await MediaLibrary.getAssetsAsync({
    first: 1000,
    mediaType: includeAudio ? ['photo', 'video', 'audio'] : ['photo', 'video'],
    sortBy: 'modificationTime',
  });
  const assets = await Promise.all(
    page.assets.map(async (asset) => {
      let size = 0;
      let uri = asset.uri;
      try {
        const info = await MediaLibrary.getAssetInfoAsync(asset, { shouldDownloadFromNetwork: false });
        size = Number((info as any).fileSize ?? 0);
        uri = info.localUri ?? info.uri;
      } catch {
        // O item ainda é válido; sem tamanho ele não entra nos filtros de tamanho.
      }
      return {
        uri: `media-library://${asset.id}`,
        name: asset.filename,
        size,
        modificationTime: asset.modificationTime * 1000,
        isDirectory: false,
        path: uri,
        category: categorize(asset.filename, size, false),
        mediaAssetId: asset.id,
      } satisfies ScannedFile;
    }),
  );
  return assets;
}

function uniqueFiles(files: ScannedFile[]): ScannedFile[] {
  const seen = new Set<string>();
  return files.filter((file) => {
    if (seen.has(file.uri)) return false;
    seen.add(file.uri);
    return true;
  });
}

function duplicateKey(file: ScannedFile): string {
  const normalized = file.name
    .toLowerCase()
    .replace(/(\s*\(\d+\)|\s*copy|\s*-\s*copy|\s*\d+)(?=\.[^.]+$)/g, '');
  return `${normalized}:${file.size}`;
}

function duplicateCandidates(files: ScannedFile[]): ScannedFile[] {
  const groups = new Map<string, ScannedFile[]>();
  for (const file of files.filter((item) => !item.isDirectory && item.size > 0)) {
    const key = duplicateKey(file);
    groups.set(key, [...(groups.get(key) ?? []), file]);
  }
  return [...groups.values()]
    .filter((group) => group.length > 1)
    .flatMap((group) => group.slice(1));
}

async function scanRoots(options: {
  minSize?: number;
  extensions?: string[];
  includeEmpty?: boolean;
  includeMedia?: boolean;
  includeAudio?: boolean;
}): Promise<ScannedFile[]> {
  const roots = [
    ...(Platform.OS === 'android' ? PUBLIC_ROOTS : []),
    FileSystem.cacheDirectory,
    FileSystem.documentDirectory,
  ].filter((value): value is string => Boolean(value));

  const scanned = await Promise.all(
    roots.map((root) => scanDirectory(root, { maxDepth: 4, ...options })),
  );
  const files = scanned.flat();
  if (options.includeMedia) files.push(...await scanMediaAssets(options.includeAudio ?? false));
  return uniqueFiles(files);
}

/**
 * Retorna dados reais para cada ferramenta avançada. Nenhum fallback
 * demonstrativo é usado: quando a permissão é recusada o hook exibe o erro.
 */
export async function scanForMode(
  mode: FileScanMode,
  options: { minSize?: number } = {},
): Promise<FileScanOutput> {
  if (Platform.OS === 'web') return { files: [], mediaAccess: null };
  const includesMedia = mode === 'large-files' || mode === 'duplicates';
  const mediaAccess = includesMedia ? await ensureMediaPermission() : null;

  let files: ScannedFile[];
  switch (mode) {
    case 'downloads':
      files = await scanRoots({
        extensions: undefined,
        includeMedia: false,
      });
      files = files.filter((file) => file.path.toLowerCase().includes('/download/'));
      break;
    case 'apk':
      files = await scanRoots({ extensions: APK_EXTENSIONS, includeMedia: false });
      break;
    case 'empty-folders':
      files = await scanRoots({ includeEmpty: true, includeMedia: false });
      files = files.filter((file) => file.isDirectory);
      break;
    case 'large-files':
      files = await scanRoots({
        minSize: options.minSize ?? 10 * 1024 * 1024,
        includeMedia: true,
        includeAudio: mediaAccess?.includeAudio,
      });
      break;
    case 'duplicates': {
      const allFiles = await scanRoots({
        includeMedia: true,
        includeAudio: mediaAccess?.includeAudio,
      });
      files = duplicateCandidates(allFiles);
      break;
    }
    case 'junk':
    default:
      files = await scanRoots({
        extensions: [...JUNK_EXTENSIONS, ...ARCHIVE_EXTENSIONS, ...APK_EXTENSIONS],
        includeMedia: false,
      });
      break;
  }

  if (mode === 'downloads') {
    files = files.map((file) => ({ ...file, category: 'download' }));
  }
  if (mode === 'large-files') {
    files = files.map((file) => ({ ...file, category: file.size > 100 * 1024 * 1024 ? 'large' : file.category }));
  }
  return {
    files,
    mediaAccess: mediaAccess?.access ?? null,
  };
}

export const scanForJunk = () => scanForMode('junk');

export async function safeDelete(uri: string): Promise<boolean> {
  if (!isSafeToDelete(uri)) return false;
  try {
    if (uri.startsWith('media-library://')) {
      const assetId = uri.slice('media-library://'.length);
      return await MediaLibrary.deleteAssetsAsync([assetId]);
    } else {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
    return true;
  } catch (error) {
    console.warn('[MaxClean] Erro ao excluir:', uri, error);
    return false;
  }
}

export async function deleteFiles(
  uris: string[],
): Promise<{ deleted: number; failed: number; deletedUris: string[] }> {
  let deleted = 0;
  let failed = 0;
  const deletedUris: string[] = [];
  const mediaUris = uris.filter((uri) => uri.startsWith('media-library://'));
  const fileUris = uris.filter((uri) => !uri.startsWith('media-library://'));

  if (mediaUris.length > 0) {
    const assetIds = mediaUris.map((uri) => uri.slice('media-library://'.length));
    try {
      const mediaDeleted = await MediaLibrary.deleteAssetsAsync(assetIds);
      if (mediaDeleted) {
        deleted += mediaUris.length;
        deletedUris.push(...mediaUris);
      } else {
        failed += mediaUris.length;
      }
    } catch (error) {
      console.warn('[MaxClean] Erro ao excluir ativos da biblioteca:', error);
      failed += mediaUris.length;
    }
  }

  for (const uri of fileUris) {
    if (await safeDelete(uri)) {
      deleted++;
      deletedUris.push(uri);
    } else {
      failed++;
    }
  }
  return { deleted, failed, deletedUris };
}

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

export async function clearOwnCache(): Promise<number> {
  if (Platform.OS === 'web') return 0;
  const before = await getOwnCacheSize();
  try {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) return 0;
    const entries = await FileSystem.readDirectoryAsync(cacheDir);
    for (const entry of entries) {
      await FileSystem.deleteAsync(cacheDir + entry, { idempotent: true });
    }
    return before;
  } catch {
    return 0;
  }
}