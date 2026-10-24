import React from 'react';
import { AdvancedFileScanner } from '@/components/AdvancedFileScanner';

export default function ApkScannerScreen() {
  return (
    <AdvancedFileScanner
      mode="apk"
      titleKey="apkScanner"
      emptyKey="apks"
    />
  );
}