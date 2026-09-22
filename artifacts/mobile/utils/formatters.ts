/**
 * Formatadores de dados para o MaxClean.
 */

/** Formata bytes para string legível (KB, MB, GB) */
export function formatBytes(bytes: number, decimals = 2): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(
    sizes.length - 1,
    Math.floor(Math.log(bytes) / Math.log(k))
  );
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/** Formata bytes para GB com 2 casas decimais */
export function formatGB(bytes: number): string {
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

/** Formata uma porcentagem com 1 casa decimal */
export function formatPercent(value: number): string {
  return Math.round(value * 100) + '%';
}

/** Formata timestamp para data/hora legível */
export function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Formata timestamp para data relativa (hoje, ontem, X dias atrás) */
export function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 30) return `${days} dias atrás`;
  if (days < 365) return `${Math.floor(days / 30)} meses atrás`;
  return `${Math.floor(days / 365)} anos atrás`;
}

/** Formata milissegundos para string de duração */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = (ms / 1000).toFixed(1);
  return `${s}s`;
}

/** Retorna extensão de arquivo em maiúsculas */
export function getExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toUpperCase();
}

/** Retorna ícone Ionicons baseado na extensão do arquivo */
export function getFileIcon(filename: string): string {
  const ext = getExtension(filename).toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image-outline',
    jpeg: 'image-outline',
    png: 'image-outline',
    gif: 'image-outline',
    webp: 'image-outline',
    mp4: 'videocam-outline',
    mov: 'videocam-outline',
    avi: 'videocam-outline',
    mkv: 'videocam-outline',
    mp3: 'musical-notes-outline',
    flac: 'musical-notes-outline',
    aac: 'musical-notes-outline',
    pdf: 'document-text-outline',
    doc: 'document-text-outline',
    docx: 'document-text-outline',
    xls: 'grid-outline',
    xlsx: 'grid-outline',
    zip: 'archive-outline',
    rar: 'archive-outline',
    '7z': 'archive-outline',
    apk: 'phone-portrait-outline',
    tmp: 'trash-outline',
    log: 'document-outline',
    bak: 'document-outline',
    old: 'document-outline',
  };
  return map[ext] ?? 'document-outline';
}

/** Retorna cor baseada no tipo de arquivo */
export function getFileColor(filename: string): string {
  const ext = getExtension(filename).toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '#F59E0B';
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return '#8B5CF6';
  if (['mp3', 'flac', 'aac'].includes(ext)) return '#10B981';
  if (['pdf', 'doc', 'docx'].includes(ext)) return '#EF4444';
  if (['zip', 'rar', '7z'].includes(ext)) return '#F97316';
  if (['apk'].includes(ext)) return '#3B82F6';
  if (['tmp', 'log', 'bak', 'old'].includes(ext)) return '#6B7280';
  return '#6B7280';
}
