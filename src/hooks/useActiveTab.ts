import { useCallback, useState } from 'react';

export type TabId = 'files' | 'recents' | 'library' | 'settings';

export function useActiveTab(initial: TabId = 'files') {
  const [activeTab, setActiveTab] = useState<TabId>(initial);

  const selectTab = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  return { activeTab, selectTab };
}
