/**
 * useFileScanner — Hook para escanear arquivos de lixo no dispositivo.
 *
 * Escaneia diretórios acessíveis sem root e retorna lista de arquivos
 * que podem ser excluídos de forma segura.
 *
 * LIMITAÇÃO HONESTA: Apps sem root não conseguem escanear /data/data/
 * de outros apps no Android 6+. Somente arquivos em armazenamento
 * externo acessível são listados.
 */
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { ScannedFile, FileScanMode, scanForMode, deleteFiles } from '@/utils/fileUtils';

export type ScanState = 'idle' | 'scanning' | 'done' | 'cleaning' | 'cleaned';

export interface ScanResult {
  files: ScannedFile[];
  totalSize: number;
  byCategory: Record<string, { files: ScannedFile[]; size: number }>;
  mediaAccess: 'all' | 'limited' | null;
}

interface ScanProgress {
  current: string;
  percent: number;
}

export function useFileScanner(
  mode: FileScanMode = 'junk',
  minSize?: number,
) {
  const [state, setState] = useState<ScanState>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [selectedUris, setSelectedUris] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<ScanProgress>({ current: '', percent: 0 });
  const [cleanedBytes, setCleanedBytes] = useState(0);
  const [cleanedCount, setCleanedCount] = useState(0);
  const [cleanFailedCount, setCleanFailedCount] = useState(0);
  const [error, setError] = useState(false);
  const [errorCode, setErrorCode] = useState<'permission-denied' | 'scan-error' | null>(null);
  const scanGeneration = useRef(0);

  /** Inicia o scan */
  const startScan = useCallback(async () => {
    const generation = ++scanGeneration.current;
    setState('scanning');
    setResult(null);
    setSelectedUris(new Set());
    setCleanedBytes(0);
    setCleanedCount(0);
    setCleanFailedCount(0);
    setError(false);
    setErrorCode(null);
    setProgress({ current: 'Iniciando...', percent: 0 });

    try {
      setProgress({ current: 'Escaneando cache...', percent: 15 });
      const scanOutput = await scanForMode(mode, { minSize });
      const files = scanOutput.files;
      if (generation !== scanGeneration.current) return;

      setProgress({ current: 'Analisando resultados...', percent: 85 });

      // Agrupa por categoria
      const byCategory: Record<string, { files: ScannedFile[]; size: number }> = {};
      let totalSize = 0;
      for (const f of files) {
        if (!byCategory[f.category]) {
          byCategory[f.category] = { files: [], size: 0 };
        }
        byCategory[f.category].files.push(f);
        byCategory[f.category].size += f.size;
        totalSize += f.size;
      }

      setProgress({ current: 'Concluído!', percent: 100 });

      const scanResult: ScanResult = {
        files,
        totalSize,
        byCategory,
        mediaAccess: scanOutput.mediaAccess,
      };
      setResult(scanResult);

      // Seleciona todos por padrão
      setSelectedUris(new Set(files.map((f) => f.uri)));

      setState('done');
    } catch (err) {
      if (generation !== scanGeneration.current) return;
      console.warn('[MaxClean] Erro no scan:', err);
      setError(true);
      setErrorCode(
        err instanceof Error && 'code' in err && (err as { code?: string }).code === 'permission-denied'
          ? 'permission-denied'
          : 'scan-error',
      );
      setState('idle');
    }
  }, [mode, minSize]);

  /** Seleciona / desseleciona arquivo */
  const toggleSelect = useCallback((uri: string) => {
    setSelectedUris((prev) => {
      const next = new Set(prev);
      if (next.has(uri)) next.delete(uri);
      else next.add(uri);
      return next;
    });
  }, []);

  /** Seleciona / desseleciona todos */
  const toggleSelectAll = useCallback(() => {
    if (!result) return;
    if (selectedUris.size === result.files.length) {
      setSelectedUris(new Set());
    } else {
      setSelectedUris(new Set(result.files.map((f) => f.uri)));
    }
  }, [result, selectedUris]);

  /** Tamanho total selecionado */
  const selectedSize = result
    ? result.files
        .filter((f) => selectedUris.has(f.uri))
        .reduce((acc, f) => acc + f.size, 0)
    : 0;

  /** Executa a limpeza dos itens selecionados */
  const executeClean = useCallback(async (urisToDelete?: string[]) => {
    const targetUris = urisToDelete ?? Array.from(selectedUris);
    if (!result || targetUris.length === 0) {
      return { deletedBytes: 0, deletedCount: 0, failedCount: 0 };
    }

    setState('cleaning');

    const fileMap = new Map(result.files.map((file) => [file.uri, file]));
    const validTargets = targetUris.filter((uri) => fileMap.has(uri));
    const deletion = Platform.OS === 'web'
      ? { deleted: 0, failed: validTargets.length, deletedUris: [] as string[] }
      : await deleteFiles(validTargets);
    const totalDeleted = deletion.deleted;
    const totalSize = deletion.deletedUris.reduce(
      (acc, uri) => acc + (fileMap.get(uri)?.size ?? 0),
      0,
    );
    const deletedUris = new Set(deletion.deletedUris);

    // Use the actual result, not the requested count. A file may disappear,
    // be read-only, or fail permission checks during deletion.
    setCleanedBytes(totalSize);
    setCleanedCount(totalDeleted);
    setCleanFailedCount(deletion.failed);

    // Keep failed items visible so the user can retry or choose another action.
    setResult((prev) => {
      if (!prev) return null;
      const remaining = prev.files.filter((file) => !deletedUris.has(file.uri));
      const newTotal = remaining.reduce((acc, f) => acc + f.size, 0);
      const newByCategory: typeof prev.byCategory = {};
      for (const f of remaining) {
        if (!newByCategory[f.category])
          newByCategory[f.category] = { files: [], size: 0 };
        newByCategory[f.category].files.push(f);
        newByCategory[f.category].size += f.size;
      }
      return {
        files: remaining,
        totalSize: newTotal,
        byCategory: newByCategory,
        mediaAccess: prev.mediaAccess,
      };
    });

    setSelectedUris(new Set(validTargets.filter((uri) => !deletedUris.has(uri))));
    setState('cleaned');
    return { deletedBytes: totalSize, deletedCount: totalDeleted, failedCount: deletion.failed };
  }, [result, selectedUris]);

  /** Reset para escanear novamente */
  const reset = useCallback(() => {
    scanGeneration.current += 1;
    setState('idle');
    setResult(null);
    setSelectedUris(new Set());
    setCleanedBytes(0);
    setCleanedCount(0);
    setCleanFailedCount(0);
    setError(false);
    setErrorCode(null);
    setProgress({ current: '', percent: 0 });
  }, []);

  return {
    state,
    result,
    selectedUris,
    selectedSize,
    progress,
    cleanedBytes,
    cleanedCount,
    cleanFailedCount,
    error,
    errorCode,
    startScan,
    toggleSelect,
    toggleSelectAll,
    executeClean,
    reset,
  };
}
