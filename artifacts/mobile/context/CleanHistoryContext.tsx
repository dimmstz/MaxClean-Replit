/**
 * CleanHistoryContext — Histórico de limpezas, estatísticas cumulativas.
 * Persistido em AsyncStorage (SQLite pode ser adicionado futuramente).
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CleanRecord {
  id: string;
  date: number; // timestamp ms
  type: string; // 'quick' | 'deep' | 'app' | 'duplicates' | etc.
  spaceFreed: number; // bytes
  filesRemoved: number;
  durationMs: number;
  items: string[]; // labels dos itens limpos
}

interface Stats {
  totalSpaceFreed: number;
  totalFilesRemoved: number;
  totalSessions: number;
}

interface CleanHistoryContextValue {
  history: CleanRecord[];
  stats: Stats;
  addRecord: (record: Omit<CleanRecord, 'id'>) => void;
  clearHistory: () => void;
}

const CleanHistoryContext = createContext<CleanHistoryContextValue>({
  history: [],
  stats: { totalSpaceFreed: 0, totalFilesRemoved: 0, totalSessions: 0 },
  addRecord: () => {},
  clearHistory: () => {},
});

const HISTORY_KEY = '@maxclean:history';

function computeStats(records: CleanRecord[]): Stats {
  return records.reduce(
    (acc, r) => ({
      totalSpaceFreed: acc.totalSpaceFreed + r.spaceFreed,
      totalFilesRemoved: acc.totalFilesRemoved + r.filesRemoved,
      totalSessions: acc.totalSessions + 1,
    }),
    { totalSpaceFreed: 0, totalFilesRemoved: 0, totalSessions: 0 }
  );
}

export function CleanHistoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [history, setHistory] = useState<CleanRecord[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setHistory(
              parsed.filter(
                (record): record is CleanRecord =>
                  !!record &&
                  typeof record === 'object' &&
                  typeof (record as CleanRecord).date === 'number' &&
                  typeof (record as CleanRecord).spaceFreed === 'number' &&
                  typeof (record as CleanRecord).filesRemoved === 'number'
              )
            );
          }
        } catch {
          // ignora JSON inválido
        }
      }
    });
  }, []);

  const persist = useCallback((records: CleanRecord[]) => {
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(records));
  }, []);

  const addRecord = useCallback(
    (record: Omit<CleanRecord, 'id'>) => {
      const newRecord: CleanRecord = {
        ...record,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      };
      setHistory((prev) => {
        const updated = [newRecord, ...prev].slice(0, 100); // máx 100 registros
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    AsyncStorage.removeItem(HISTORY_KEY);
  }, []);

  return (
    <CleanHistoryContext.Provider
      value={{ history, stats: computeStats(history), addRecord, clearHistory }}
    >
      {children}
    </CleanHistoryContext.Provider>
  );
}

export function useCleanHistory() {
  return useContext(CleanHistoryContext);
}
