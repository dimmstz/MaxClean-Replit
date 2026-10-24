import React from 'react';
import { AdvancedFileScanner } from '@/components/AdvancedFileScanner';

export default function DuplicatesScreen() {
  return (
    <AdvancedFileScanner
      mode="duplicates"
      titleKey="duplicates"
      emptyKey="duplicatesFound"
    />
  );
}