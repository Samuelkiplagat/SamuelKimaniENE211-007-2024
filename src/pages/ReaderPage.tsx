import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { HighlightColor, HighlightOverlay, PendingSelection } from '../classes/AnnotationEngine';
import { AnnotationNoteModal } from '../components/reader/AnnotationNoteModal';
import { LookupPanel } from '../components/reader/LookupPanel';
import { SelectionActionMenu } from '../components/reader/SelectionActionMenu';
import type { LookupResult } from '../classes/VocabManager';
import { deriveContextSentence } from '../utils/contextSentence';
import { useAppServices } from '../context/AppServicesContext';
import { useSettings } from '../context/SettingsContext';
import type { PageDimensions } from '../classes/PDFRendererAdapter';
import { usePinchZoom } from '../hooks/usePinchZoom';

interface ReaderPageProps {
  documentId: string;
  onBack: () => void;
}

export function ReaderPage({ documentId, onBack }: ReaderPageProps) {
  const { fileManager, pdfRenderer, annotationEngine, vocabManager } =
    useAppServices();
  const { settings } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const pageLayerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState('Loading…');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pageSize, setPageSize] = useState<PageDimensions | null>(null);
  const [overlays, setOverlays] = useState<HighlightOverlay[]>([]);
  const [pendingSelection, setPendingSelection] =
    useState<PendingSelection | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [lookupSelectionText, setLookupSelectionText] = useState('');
  const [savingToLibrary, setSavingToLibrary] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(false);

  const refreshOverlays = useCallback(() => {
    setOverlays(
      annotationEngine.getOverlaysForPage(pdfRenderer.getCurrentPage()),
    );
  }, [annotationEngine, pdfRenderer]);

  const renderCurrentPage = useCallback(async () => {
    const canvas = canvasRef.current;
    const textLayer = textLayerRef.current;
    const container = viewportRef.current;
    if (!canvas || !textLayer || !container) return;

    window.getSelection()?.removeAllRanges();
    annotationEngine.clearPendingSelection();
    setPendingSelection(null);
    setLookupOpen(false);
    setLookupResult(null);
    setLookupError(null);
    setSavedToLibrary(false);

    if (settings) {
      pdfRenderer.setReaderFontSize(settings.readerFontSize);
    }

    const width = container.clientWidth;
    const dims = await pdfRenderer.renderPage(canvas, width);
    await pdfRenderer.renderTextLayer(textLayer, width);

    if (dims) setPageSize(dims);
    setPage(pdfRenderer.getCurrentPage());
    setPageCount(pdfRenderer.getPageCount());
    setZoom(pdfRenderer.getZoom());
    refreshOverlays();
  }, [pdfRenderer, annotationEngine, refreshOverlays, settings]);

  useEffect(() => {
    if (!settings || loading) return;
    pdfRenderer.setReaderFontSize(settings.readerFontSize);
    void renderCurrentPage();
  }, [settings?.readerFontSize, loading, pdfRenderer, renderCurrentPage, settings]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        annotationEngine.setDocument(documentId);
        await fileManager.recordOpen(documentId);
        const doc = await fileManager.getDocument(documentId);
        if (cancelled) return;
        setTitle(doc?.displayName ?? 'Document');

        await pdfRenderer.loadDocument(documentId);
        await annotationEngine.loadAnnotations(documentId);
        if (cancelled) return;

        await renderCurrentPage();
        if (!cancelled) setLoading(false);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError('Could not open this PDF. Try importing it again.');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      void pdfRenderer.destroy();
    };
  }, [
    documentId,
    fileManager,
    pdfRenderer,
    annotationEngine,
    renderCurrentPage,
  ]);

  useEffect(() => {
    const container = viewportRef.current;
    if (!container || loading) return;

    const observer = new ResizeObserver(() => {
      void renderCurrentPage();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [loading, renderCurrentPage]);

  const handleSelectionEnd = useCallback(() => {
    const layer = pageLayerRef.current;
    if (!layer) return;

    const sel = window.getSelection();
    const pending = annotationEngine.captureSelection(
      sel,
      layer,
      pdfRenderer.getCurrentPage(),
    );
    setPendingSelection(pending);
  }, [annotationEngine, pdfRenderer]);

  useEffect(() => {
    if (loading) return;

    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        if (!showNoteModal) {
          setPendingSelection(annotationEngine.getPendingSelection());
        }
      }
    };

    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('mouseup', handleSelectionEnd);
    document.addEventListener('touchend', handleSelectionEnd);

    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('mouseup', handleSelectionEnd);
      document.removeEventListener('touchend', handleSelectionEnd);
    };
  }, [loading, handleSelectionEnd, showNoteModal, annotationEngine]);

  const applyZoom = useCallback(
    (scale: number) => {
      pdfRenderer.setZoom(scale);
      void renderCurrentPage();
    },
    [pdfRenderer, renderCurrentPage],
  );

  const pinchHandlers = usePinchZoom(
    () => pdfRenderer.getZoom(),
    applyZoom,
  );

  const goNext = () => {
    if (pdfRenderer.nextPage()) void renderCurrentPage();
  };

  const goPrev = () => {
    if (pdfRenderer.prevPage()) void renderCurrentPage();
  };

  const zoomIn = () => {
    pdfRenderer.zoomIn();
    void renderCurrentPage();
  };

  const zoomOut = () => {
    pdfRenderer.zoomOut();
    void renderCurrentPage();
  };

  const handleHighlight = async (color: HighlightColor) => {
    await annotationEngine.addHighlight(color);
    window.getSelection()?.removeAllRanges();
    setPendingSelection(null);
    refreshOverlays();
  };

  const handleSaveNote = async (note: string) => {
    await annotationEngine.addNote(note);
    window.getSelection()?.removeAllRanges();
    setPendingSelection(null);
    refreshOverlays();
  };

  const closeMenu = () => {
    annotationEngine.clearPendingSelection();
    setPendingSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleLookUp = async () => {
    if (!pendingSelection) return;
    const query = pendingSelection.text;
    setLookupQuery(query);
    setLookupSelectionText(query);
    setSavedToLibrary(false);
    setLookupOpen(true);
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);
    closeMenu();

    try {
      const result = await vocabManager.lookupWord(query);
      setLookupResult(result);
    } catch (err) {
      setLookupError(
        err instanceof Error ? err.message : 'Could not look up this word.',
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const closeLookup = () => {
    setLookupOpen(false);
    setLookupResult(null);
    setLookupError(null);
    setSavedToLibrary(false);
  };

  const handleSaveToLibrary = async () => {
    if (!lookupResult) return;
    setSavingToLibrary(true);
    try {
      const contextSentence = deriveContextSentence(
        lookupResult.word,
        lookupSelectionText,
      );
      await vocabManager.saveEntry({
        word: lookupResult.word,
        definition: lookupResult.definition,
        phonetic: lookupResult.phonetic,
        partOfSpeech: lookupResult.partOfSpeech,
        contextSentence,
        sourceDocumentId: documentId,
        sourceDocumentName: title,
      });
      setSavedToLibrary(true);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'Could not save to library.',
      );
    } finally {
      setSavingToLibrary(false);
    }
  };

  const zoomPercent = Math.round(zoom * 100);
  const nightMode = settings?.pageBackground === 'night';
  const darkUi = settings?.theme === 'dark';

  return (
    <div
      className={`flex min-h-dvh flex-col ${
        nightMode ? 'bg-slate-950' : 'bg-slate-200'
      }`}
    >
      <header
        className={`sticky top-0 z-20 border-b shadow-sm ${
          darkUi
            ? 'border-slate-700 bg-slate-800'
            : 'border-slate-300 bg-white'
        }`}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-2 py-2">
          <button
            type="button"
            onClick={onBack}
            className={`flex min-h-tap min-w-tap shrink-0 items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
              darkUi
                ? 'text-slate-200 hover:bg-slate-700'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1
            className={`min-w-0 flex-1 truncate text-base font-semibold ${
              darkUi ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            {title}
          </h1>
        </div>

        <div
          className={`mx-auto flex max-w-3xl items-center justify-between gap-2 border-t px-2 py-2 ${
            darkUi ? 'border-slate-700' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goPrev}
              disabled={loading || page <= 1}
              className={`flex min-h-tap min-w-tap items-center justify-center rounded-lg disabled:opacity-40 ${
                darkUi
                  ? 'text-slate-200 hover:bg-slate-700'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <span
              className={`min-w-[7rem] text-center text-sm font-medium ${
                darkUi ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Page {page} of {pageCount || '—'}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={loading || page >= pageCount}
              className={`flex min-h-tap min-w-tap items-center justify-center rounded-lg disabled:opacity-40 ${
                darkUi
                  ? 'text-slate-200 hover:bg-slate-700'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              aria-label="Next page"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={zoomOut}
              disabled={loading || zoom <= 0.5}
              className={`flex min-h-tap min-w-tap items-center justify-center rounded-lg disabled:opacity-40 ${
                darkUi
                  ? 'text-slate-200 hover:bg-slate-700'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <span
              className={`w-12 text-center text-xs font-medium ${
                darkUi ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              {zoomPercent}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              disabled={loading || zoom >= 3}
              className={`flex min-h-tap min-w-tap items-center justify-center rounded-lg disabled:opacity-40 ${
                darkUi
                  ? 'text-slate-200 hover:bg-slate-700'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden">
        {loading && (
          <p
            className={`absolute inset-0 z-10 flex items-center justify-center text-sm ${
              darkUi ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Opening PDF…
          </p>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={onBack}
              className="min-h-tap rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white"
            >
              Go back
            </button>
          </div>
        )}

        <div
          ref={viewportRef}
          className={`mx-auto h-full max-w-3xl overflow-auto touch-pan-y px-2 py-4 ${
            loading || error ? 'invisible' : ''
          }`}
          {...pinchHandlers}
          style={{ touchAction: 'pan-y pinch-zoom' }}
        >
          <div
            ref={pageLayerRef}
            className={`relative mx-auto rounded-lg shadow-md ${
              nightMode ? 'bg-slate-800' : 'bg-white'
            }`}
            style={
              pageSize
                ? { width: pageSize.width, height: pageSize.height }
                : undefined
            }
          >
            <canvas
              ref={canvasRef}
              className="block"
              role="img"
              aria-label={`PDF page ${page}`}
            />

            <div className="pointer-events-none absolute inset-0" aria-hidden>
              {overlays.map((overlay) =>
                overlay.rects.map((rect, idx) => (
                  <div
                    key={`${overlay.id}-${idx}`}
                    className="highlight-overlay"
                    style={{
                      left: rect.x,
                      top: rect.y,
                      width: rect.width,
                      height: rect.height,
                      backgroundColor: overlay.fill,
                    }}
                    title={overlay.note}
                  />
                )),
              )}
            </div>

            <div ref={textLayerRef} className="textLayer" />

            {pendingSelection && !showNoteModal && !lookupOpen && (
              <SelectionActionMenu
                selection={pendingSelection}
                onHighlight={(color) => void handleHighlight(color)}
                onLookUp={() => void handleLookUp()}
                onAddNote={() => setShowNoteModal(true)}
                onClose={closeMenu}
              />
            )}
          </div>
        </div>
      </main>

      {showNoteModal && pendingSelection && (
        <AnnotationNoteModal
          selectedText={pendingSelection.text}
          onSave={handleSaveNote}
          onClose={() => setShowNoteModal(false)}
        />
      )}

      {lookupOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/30"
            aria-label="Close lookup"
            onClick={closeLookup}
          />
          <LookupPanel
            query={lookupQuery}
            result={lookupResult}
            loading={lookupLoading}
            error={lookupError}
            saving={savingToLibrary}
            saved={savedToLibrary}
            onSave={() => void handleSaveToLibrary()}
            onClose={closeLookup}
          />
        </>
      )}
    </div>
  );
}
