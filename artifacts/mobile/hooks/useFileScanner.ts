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
import { ScannedFile, scanForJunk, deleteFiles } from '@/utils/fileUtils';

export type ScanState = 'idle' | 'scanning' | 'done' | 'cleaning' | 'cleaned';

export interface ScanResult {
  files: ScannedFile[];
  totalSize: number;
  byCategory: Record<string, { files: ScannedFile[]; size: number }>;
}

interface ScanProgress {
  current: string;
  percent: number;
}

export function useFileScanner() {
  const [state, setState] = useState<ScanState>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [selectedUris, setSelectedUris] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<ScanProgress>({ current: '', percent: 0 });
  const [cleanedBytes, setCleanedBytes] = useState(0);
  const [cleanedCount, setCleanedCount] = useState(0);
  const [error, setError] = useState(false);
  const scanGeneration = useRef(0);

  /** Inicia o scan */
  const startScan = useCallback(async () => {
    const generation = ++scanGeneration.current;
    setState('scanning');
    setResult(null);
    setSelectedUris(new Set());
    setError(false);
    setProgress({ current: 'Iniciando...', percent: 0 });

    try {
      setProgress({ current: 'Escaneando cache...', percent: 15 });
      const files = await scanForJunk();
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

      const scanResult: ScanResult = { files, totalSize, byCategory };
      setResult(scanResult);

      // Seleciona todos por padrão
      setSelectedUris(new Set(files.map((f) => f.uri)));

      setState('done');
    } catch (err) {
      if (generation !== scanGeneration.current) return;
      console.warn('[MaxClean] Erro no scan:', err);
      setError(true);
      setState('idle');
    }
  }, []);

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
  const executeClean = useCallback(async () => {
    if (!result || selectedUris.size === 0) return;

    setState('cleaning');
    const startTime = Date.now();

    // Filtra URIs mock (web preview) — não chama FileSystem.delete
    const realUris = Array.from(selectedUris).filter(
      (uri) => !uri.startsWith('mock://')
    );
    const mockUris = Array.from(selectedUris).filter((uri) =>
      uri.startsWith('mock://')
    );

    let totalDeleted = 0;
    let totalSize = 0;

    // Exclui arquivos reais
    if (Platform.OS !== 'web' && realUris.length > 0) {
      const fileMap = new Map(result.files.map((f) => [f.uri, f]));
      const { deleted, deletedUris } = await deleteFiles(realUris);
      totalDeleted += deleted;
      totalSize += deletedUris
        .reduce((acc, uri) => acc + (fileMap.get(uri)?.size ?? 0), 0);
    }

    // Conta mocks como deletados (para web preview)
    const fileMap = new Map(result.files.map((f) => [f.uri, f]));
    totalDeleted += mockUris.length;
    totalSize += mockUris.reduce(
      (acc, uri) => acc + (fileMap.get(uri)?.size ?? 0),
      0
    );

    // Use the actual result, not the requested count. A file may disappear,
    // be read-only, or fail permission checks during deletion.
    setCleanedBytes(totalSize);
    setCleanedCount(totalDeleted);

    // Remove itens deletados do resultado
    setResult((prev) => {
      if (!prev) return null;
      const remaining = prev.files.filter((f) => !selectedUris.has(f.uri));
      const newTotal = remaining.reduce((acc, f) => acc + f.size, 0);
      const newByCategory: typeof prev.byCategory = {};
      for (const f of remaining) {
        if (!newByCategory[f.category])
          newByCategory[f.category] = { files: [], size: 0 };
        newByCategory[f.category].files.push(f);
        newByCategory[f.category].size += f.size;
      }
      return { files: remaining, totalSize: newTotal, byCategory: newByCategory };
    });

    setSelectedUris(new Set());
    setState('cleaned');
  }, [result, selectedUris, selectedSize]);

  /** Reset para escanear novamente */
  const reset = useCallback(() => {
    scanGeneration.current += 1;
    setState('idle');
    setResult(null);
    setSelectedUris(new Set());
    setCleanedBytes(0);
    setCleanedCount(0);
    setError(false);
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
    error,
    startScan,
    toggleSelect,
    toggleSelectAll,
    executeClean,
    reset,
  };
}
