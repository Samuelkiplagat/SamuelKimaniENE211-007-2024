import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { BottomNav } from './components/layout/BottomNav';
import { useActiveTab } from './hooks/useActiveTab';
import { FilesPage } from './pages/FilesPage';
import { RecentsPage } from './pages/RecentsPage';
import { LibraryPage } from './pages/LibraryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReaderPage } from './pages/ReaderPage';

function TabContent({
  tab,
  onOpenDocument,
  listRefresh,
}: {
  tab: ReturnType<typeof useActiveTab>['activeTab'];
  onOpenDocument: (id: string) => void;
  listRefresh: number;
}) {
  switch (tab) {
    case 'files':
      return <FilesPage onOpenDocument={onOpenDocument} />;
    case 'recents':
      return (
        <RecentsPage
          onOpenDocument={onOpenDocument}
          refreshToken={listRefresh}
        />
      );
    case 'library':
      return <LibraryPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <FilesPage onOpenDocument={onOpenDocument} />;
  }
}

export default function App() {
  const { activeTab, selectTab } = useActiveTab('files');
  const [readerDocumentId, setReaderDocumentId] = useState<string | null>(null);
  const [listRefresh, setListRefresh] = useState(0);

  if (readerDocumentId) {
    return (
      <ReaderPage
        documentId={readerDocumentId}
        onBack={() => {
          setReaderDocumentId(null);
          setListRefresh((n) => n + 1);
        }}
      />
    );
  }

  return (
    <>
      <AppShell>
        <TabContent
          tab={activeTab}
          onOpenDocument={(id) => setReaderDocumentId(id)}
          listRefresh={listRefresh}
        />
      </AppShell>
      <BottomNav activeTab={activeTab} onSelect={selectTab} />
    </>
  );
}
