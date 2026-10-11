import { useRef, useState } from 'react';
import { AppHeader, Button, Notice, Page, SectionHeader, Stack, useSnackbar } from '../../components';
import { t } from '../../i18n';
import { useStore } from '../../lib/store';

export function Settings() {
  const { exportFile, importFile } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const snackbar = useSnackbar();
  const [error, setError] = useState('');

  const download = async () => {
    const blob = new Blob([await exportFile()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flavorfam-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      await importFile(await file.text());
      setError('');
      snackbar.show(t('settings.imported'));
    } catch {
      setError(t('settings.importError'));
    }
  };

  return (
    <>
      <AppHeader title={t('settings.title')} />
      <Page>
        <Stack gap={3} as="section">
          <SectionHeader title={t('settings.data')} />
          <p>{t('settings.dataHint')}</p>
          <Stack row gap={3}>
            <Button icon="download" onClick={download}>{t('settings.export')}</Button>
            <Button icon="upload" variant="secondary" onClick={() => fileRef.current?.click()}>{t('settings.import')}</Button>
          </Stack>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden aria-hidden="true" tabIndex={-1}
            onChange={(e) => onFile(e.target.files?.[0])} />
          {error && <Notice tone="danger" role="alert">{error}</Notice>}
        </Stack>
      </Page>
    </>
  );
}
