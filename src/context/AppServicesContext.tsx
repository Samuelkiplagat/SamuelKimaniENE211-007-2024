import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { lexireadDb } from '../db/lexireadDb';
import {
  AnnotationEngine,
  DataStore,
  DictionaryAPIClient,
  FileManager,
  NotificationScheduler,
  PDFRendererAdapter,
  SearchController,
  SettingsManager,
  VocabManager,
  WikipediaAPIClient,
} from '../classes';

export interface AppServices {
  dataStore: DataStore;
  fileManager: FileManager;
  pdfRenderer: PDFRendererAdapter;
  annotationEngine: AnnotationEngine;
  vocabManager: VocabManager;
  dictionaryClient: DictionaryAPIClient;
  wikipediaClient: WikipediaAPIClient;
  notificationScheduler: NotificationScheduler;
  searchController: SearchController;
  settingsManager: SettingsManager;
}

const AppServicesContext = createContext<AppServices | null>(null);

function createServices(): AppServices {
  const dataStore = new DataStore(lexireadDb);
  const searchController = new SearchController();
  const dictionaryClient = new DictionaryAPIClient();
  const wikipediaClient = new WikipediaAPIClient();
  const settingsManager = new SettingsManager(dataStore);

  return {
    dataStore,
    fileManager: new FileManager(dataStore, searchController),
    pdfRenderer: new PDFRendererAdapter(dataStore),
    annotationEngine: new AnnotationEngine(dataStore),
    vocabManager: new VocabManager(
      dataStore,
      dictionaryClient,
      wikipediaClient,
      searchController,
    ),
    dictionaryClient,
    wikipediaClient,
    notificationScheduler: new NotificationScheduler(dataStore, settingsManager),
    searchController,
    settingsManager,
  };
}

export function AppServicesProvider({ children }: { children: ReactNode }) {
  const services = useMemo(() => createServices(), []);

  useEffect(() => {
    void services.dataStore.init().then(() => {
      if (import.meta.env.DEV) {
        console.log(
          '[LexiRead] DB ready — stores: documents, vocabulary, annotations, settings, notificationLog',
        );
      }
      void services.notificationScheduler.init();
    });
  }, [services.dataStore, services.notificationScheduler]);

  return (
    <AppServicesContext.Provider value={services}>
      {children}
    </AppServicesContext.Provider>
  );
}

export function useAppServices(): AppServices {
  const ctx = useContext(AppServicesContext);
  if (!ctx) {
    throw new Error('useAppServices must be used within AppServicesProvider');
  }
  return ctx;
}
