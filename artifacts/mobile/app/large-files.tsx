import React from 'react';
import { AdvancedFileScanner } from '@/components/AdvancedFileScanner';

export default function LargeFilesScreen() {
  return (
    <AdvancedFileScanner
      mode="large-files"
      titleKey="largeFiles"
      emptyKey="largeFiles"
      filter="large"
    />
  );
}