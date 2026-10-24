import React from 'react';
import { AdvancedFileScanner } from '@/components/AdvancedFileScanner';

export default function DownloadsScreen() {
  return (
    <AdvancedFileScanner
      mode="downloads"
      titleKey="downloads"
      emptyKey="downloads"
      filter="downloads"
    />
  );
}