'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import { Shield, BookOpen, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { FairyQuote } from '@/components/branding/fairy-quote';
import { Button } from '@/components/ui/button';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

interface FascinatingReaderProps {
  pdfUrl: string | null;
  isFullAccess: boolean;
  previewStart?: number;
  previewEnd?: number;
  bookId?: string;
}

export function FascinatingReader({
  pdfUrl,
  isFullAccess,
  previewStart = 1,
  previewEnd = 10,
}: FascinatingReaderProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [containerWidth, setContainerWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!pdfUrl) {
      setLoading(false);
      setError(true);
      console.log('FascinatingReader: pdfUrl is', pdfUrl);
      return;
    }
    console.log('FascinatingReader: loading PDF from', pdfUrl);
  }, [pdfUrl]);

  useEffect(() => {
    if (containerRef.current) {
      const updateWidth = () => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.offsetWidth - 32);
        }
      };
      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError(false);
    setCurrentPage(isFullAccess ? 1 : previewStart);
  }

  function onDocumentLoadError(err: Error) {
    console.error('PDF load error:', err);
    setLoading(false);
    setError(true);
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' || e.key === 'c')) {
      e.preventDefault();
    }
  }

  const visiblePages = isFullAccess
    ? Array.from({ length: numPages }, (_, i) => i + 1)
    : Array.from({ length: Math.min(previewEnd - previewStart + 1, numPages) }, (_, i) => previewStart + i);

  function prevPage() {
    if (currentPage > visiblePages[0]) setCurrentPage(currentPage - 1);
  }

  function nextPage() {
    if (currentPage < visiblePages[visiblePages.length - 1]) setCurrentPage(currentPage + 1);
  }

  if (error || !pdfUrl) {
    return (
      <div
        className="black-gold-border rounded-xl bg-[#0a0a0a] p-12 text-center select-none"
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <BookOpen className="h-16 w-16 text-[hsl(43_65%_52%)] mx-auto mb-4" />
        <p className="text-foreground font-serif text-lg mb-2">PDF Not Available</p>
        <p className="text-sm text-muted-foreground">
          Bucket fixed — Re-upload PDF in Admin My Books → Edit
        </p>
        <p className="text-xs text-muted-foreground mt-2 font-mono break-all">
          {pdfUrl || 'No URL set'}
        </p>
      </div>
    );
  }

  return (
    <div
      className="black-gold-border rounded-xl bg-[#0a0a0a] overflow-hidden select-none"
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{ userSelect: 'none' }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(43_30%_25%)] bg-[hsl(0_0%_5%)]">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[hsl(43_65%_52%)]" />
          <span className="text-xs text-[hsl(43_65%_52%)] font-semibold">
            {isFullAccess ? 'Full Access — READ ONLY' : 'Sample Preview'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-serif italic">
          For 5% THINKERS
        </span>
        {numPages > 0 && (
          <span className="text-xs text-muted-foreground">
            Page {currentPage} / {isFullAccess ? numPages : `${previewStart}-${previewEnd}`}
          </span>
        )}
      </div>

      {/* PDF display area */}
      <div ref={containerRef} className="flex flex-col items-center py-6 min-h-[500px]">
        {loading && (
          <div className="flex flex-col items-center gap-3 py-20">
            <Loader2 className="h-8 w-8 text-[hsl(43_65%_52%)] animate-spin" />
            <p className="text-sm text-muted-foreground">Loading fairy tale...</p>
          </div>
        )}

        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          error={null}
          className="flex flex-col items-center"
        >
          {!loading && !error && (
            <>
              {/* Single page view with flip-style on desktop */}
              <div className={isMobile ? '' : 'shadow-2xl'}>
                <Page
                  pageNumber={currentPage}
                  width={Math.min(containerWidth, isMobile ? containerWidth : 700)}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="border-2 border-[hsl(43_30%_25%)] rounded-lg overflow-hidden"
                />
              </div>

              {/* Navigation controls */}
              <div className="flex items-center gap-4 mt-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevPage}
                  disabled={currentPage <= visiblePages[0]}
                  className="text-[hsl(43_65%_52%)] hover:bg-[hsl(43_65%_52%)]/10 disabled:opacity-30"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="flex items-center gap-1.5">
                  {visiblePages.slice(0, 10).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        currentPage === pg
                          ? 'bg-[hsl(43_65%_52%)] w-4'
                          : 'bg-[hsl(0_0%_20%)] hover:bg-[hsl(0_0%_30%)]'
                      }`}
                    />
                  ))}
                  {visiblePages.length > 10 && <span className="text-xs text-muted-foreground ml-1">...</span>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextPage}
                  disabled={currentPage >= visiblePages[visiblePages.length - 1]}
                  className="text-[hsl(43_65%_52%)] hover:bg-[hsl(43_65%_52%)]/10 disabled:opacity-30"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </>
          )}
        </Document>
      </div>

      {/* Footer fairy quote */}
      <div className="px-4 py-3 border-t border-[hsl(43_30%_25%)] bg-[hsl(0_0%_5%)]">
        <FairyQuote size="sm" />
      </div>
    </div>
  );
}
