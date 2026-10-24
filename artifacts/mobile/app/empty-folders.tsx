import React from 'react';
import { AdvancedFileScanner } from '@/components/AdvancedFileScanner';

export default function EmptyFoldersScreen() {
  return (
    <AdvancedFileScanner
      mode="empty-folders"
      titleKey="emptyFoldersTitle"
      emptyKey="emptyFolders"
    />
  );
}