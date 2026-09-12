'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Upload,
  Save,
  Send,
  Plus,
  X,
  Link as LinkIcon,
  IndianRupee,
  FileText,
  ImageIcon,
} from 'lucide-react';
import { CoinLogo } from '@/components/branding/coin-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FairyQuote } from '@/components/branding/fairy-quote';
import { supabase } from '@/lib/supabase-client';
import { VELS, CATEGORIES, LANGUAGES } from '@/lib/constants';
import { toast } from 'sonner';

// NEW - Cloudinary upload helper
async function uploadToCloudinary(file: File, folder: string): Promise<string | null> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: fd,
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Cloudinary upload failed:', data);
    throw new Error(data.error || 'Upload failed');
  }
  return data.url as string;
}

export default function CreateEbookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authors, setAuthors] = useState<string[]>(['Shanmugavel M']);
  const [newAuthor, setNewAuthor] = useState('');
  const [mrp, setMrp] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [previewStart, setPreviewStart] = useState('1');
  const [previewEnd, setPreviewEnd] = useState('10');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState(VELS.founder.publisher);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [aboutAuthors, setAboutAuthors] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [epubFile, setEpubFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editId) {
      loadBook(editId);
    }
  }, [editId]);

  async function loadBook(id: string) {
    const { data, error } = await supabase.from('ebooks').select('*').eq('id', id).maybeSingle();
    if (data) {
      setTitle(data.title || '');
      setSubtitle(data.subtitle || '');
      setAuthors(data.authors || ['Shanmugavel M']);
      setMrp(String(data.mrp || ''));
      setVisibility(data.visibility || 'public');
      setPreviewStart(String(data.preview_start || 1));
      setPreviewEnd(String(data.preview_end || 10));
      setIsbn(data.isbn || '');
      setPublisher(data.publisher || VELS.founder.publisher);
      setSelectedLanguages(data.languages || ['English']);
      setSelectedCategories(data.categories || []);
      setAboutAuthors(data.about_authors || '');
      setDescription(data.description || '');
      setCoverUrl(data.cover_url || null);
      setPdfUrl(data.pdf_url || null);
    }
  }

  function addAuthor() {
    if (newAuthor.trim()) {
      setAuthors([...authors, newAuthor.trim()]);
      setNewAuthor('');
    }
  }

  function removeAuthor(idx: number) {
    setAuthors(authors.filter((_, i) => i!== idx));
  }

  function toggleLanguage(lang: string) {
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter((l) => l!== lang));
      }
    } else {
      if (selectedLanguages.length < 2) {
        setSelectedLanguages([...selectedLanguages, lang]);
      }
    }
  }

  function toggleCategory(cat: string) {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c!== cat));
    } else {
      if (selectedCategories.length < 2) {
        setSelectedCategories([...selectedCategories, cat]);
      }
    }
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['.pdf', '.doc', '.docx', '.rtf', '.txt', '.odt', '.mobi'];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (validTypes.includes(ext) || file.type === 'application/pdf') {
        setPdfFile(file);
        toast.success(`Selected: ${file.name}`);
      } else {
        toast.error('Please upload a PDF, DOC, DOCX, RTF, TXT, ODT, or MOBI file');
      }
    }
  }

  // REMOVED old supabase upload, now using Cloudinary 25GB
  async function handleSubmit(e: React.FormEvent, status: 'draft' | 'published') {
    e.preventDefault();
    console.log('Create eBook form submitted. Status:', status);

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!mrp.trim()) {
      toast.error('MRP is required');
      return;
    }

    setSaving(true);

    let uploadedCoverUrl = coverUrl;
    let uploadedPdfUrl = pdfUrl;

    try {
      // Upload cover to CLOUDINARY - vels-books/covers
      if (coverFile) {
        toast.loading('Uploading cover to Cloudinary 25GB...');
        uploadedCoverUrl = await uploadToCloudinary(coverFile, 'vels-books/covers');
        toast.dismiss();
        if (!uploadedCoverUrl) {
          toast.error('Failed to upload cover image');
          setSaving(false);
          return;
        }
        toast.success('Cover uploaded to Cloudinary!');
      }

      // Upload PDF to CLOUDINARY - vels-books/pdfs
      if (pdfFile) {
        toast.loading('Uploading PDF to Cloudinary 25GB...');
        uploadedPdfUrl = await uploadToCloudinary(pdfFile, 'vels-books/pdfs');
        toast.dismiss();
        if (!uploadedPdfUrl) {
          toast.error('Failed to upload PDF');
          setSaving(false);
          return;
        }
        toast.success('PDF uploaded to Cloudinary!');
      }

      const bookData = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        authors,
        cover_url: uploadedCoverUrl,
        pdf_url: uploadedPdfUrl,
        mrp: parseInt(mrp) || 0,
        visibility,
        preview_start: parseInt(previewStart) || 1,
        preview_end: parseInt(previewEnd) || 10,
        isbn: isbn.trim() || null,
        publisher: publisher.trim() || VELS.founder.publisher,
        languages: selectedLanguages,
        categories: selectedCategories,
        about_authors: aboutAuthors.trim() || null,
        description: description.trim() || null,
        status,
        sku: `EB-${Date.now().toString().slice(-6)}`,
      };

      console.log('Saving book data:', bookData);

      let result;
      if (editId) {
        result = await supabase.from('ebooks').update(bookData).eq('id', editId).select().maybeSingle();
      } else {
        result = await supabase.from('ebooks').insert(bookData).select().maybeSingle();
      }

      if (result.error) {
        console.error('Save error:', result.error);
        toast.error(`Failed to save: ${result.error.message}`);
      } else {
        console.log('Saved successfully:', result.data);
        toast.success(status === 'published'? 'eBook Published successfully!' : 'Draft saved');
        router.push('/admin/mybooks');
        router.refresh();
      }
    } catch (err) {
      console.error('Exception:', err);
      toast.error('An error occurred while saving');
    }

    setSaving(false);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <CoinLogo size={36} />
        <div>
          <h1 className="font-serif text-2xl gold-text font-bold">
            {editId? 'Edit eBook' : 'Create eBook'}
          </h1>
          <p className="text-xs text-muted-foreground">GUNSTORY style • Cover = First Page • Now using Cloudinary 25GB</p>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, 'draft')} className="space-y-6">
        {/* Title */}
        <div className="black-gold-card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[hsl(43_65%_52%)]" />
            Book Information
          </h2>

          <div className="space-y-2">
            <Label className="text-[hsl(43_65%_52%)]">Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title"
              required
              className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)]"
            />
          </div>

          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Optional subtitle"
              className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)]"
            />
          </div>

          {/* Authors */}
          <div className="space-y-2">
            <Label>Authors (Shanmugavel M +)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {authors.map((author, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 bg-[hsl(43_65%_52%)]/10 text-[hsl(43_65%_52%)] text-sm px-3 py-1 rounded-full">
                  {author}
                  {authors.length > 1 && (
                    <button type="button" onClick={() => removeAuthor(idx)}>
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="Add author name"
                className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)]"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAuthor(); } }}
              />
              <Button type="button" onClick={addAuthor} variant="outline" className="border-[hsl(43_30%_25%)]">
                <Plus className="h-4 w-4" /> ADD AUTHOR
              </Button>
            </div>
          </div>

          {/* MRP */}
          <div className="space-y-2">
            <Label className="text-[hsl(43_65%_52%)]">MRP (Rs) *</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                placeholder="299"
                required
                className="pl-9 bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)]"
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Visibility</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  visibility === 'public'
                   ? 'bg-[hsl(43_65%_52%)]/10 text-[hsl(43_65%_52%)] border border-[hsl(43_65%_52%)]/30'
                    : 'text-muted-foreground border border-transparent hover:bg-[hsl(0_0%_12%)]'
                }`}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  visibility === 'private'
                   ? 'bg-[hsl(43_65%_52%)]/10 text-[hsl(43_65%_52%)] border border-[hsl(43_65%_52%)]/30'
                    : 'text-muted-foreground border border-transparent hover:bg-[hsl(0_0%_12%)]'
                }`}
              >
                Private
              </button>
            </div>
          </div>
        </div>

        {/* Files */}
        <div className="black-gold-card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold flex items-center gap-2">
            <Upload className="h-4 w-4 text-[hsl(43_65%_52%)]" />
            Upload Files (Cloudinary 25GB)
          </h2>

          {/* PDF */}
          <div className="space-y-2">
            <Label className="text-[hsl(43_65%_52%)]">PDF / Document REQUIRED *</Label>
            <p className="text-xs text-muted-foreground">
              Accepts PDF, DOC, DOCX, RTF, TXT, ODT, MOBI → stored in Cloudinary
            </p>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-[hsl(43_30%_25%)] rounded-lg hover:border-[hsl(43_65%_52%)] transition-all text-sm">
                  <FileText className="h-4 w-4 text-[hsl(43_65%_52%)]" />
                  {pdfFile? pdfFile.name : pdfUrl? 'PDF uploaded (click to replace)' : 'Choose PDF / Document'}
                </div>
                <input type="file" accept=".pdf,.doc,.docx,.rtf,.txt,.odt,.mobi,application/pdf" onChange={handlePdfChange} className="hidden" />
              </label>
            </div>
          </div>

          {/* EPUB */}
          <div className="space-y-2">
            <Label>EPUB (Optional)</Label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-[hsl(43_30%_25%)] rounded-lg hover:border-[hsl(43_65%_52%)] transition-all text-sm">
                  <FileText className="h-4 w-4 text-[hsl(43_65%_52%)]" />
                  {epubFile? epubFile.name : 'Choose EPUB (optional)'}
                </div>
                <input type="file" accept=".epub" onChange={(e) => setEpubFile(e.target.files?.[0] || null)} className="hidden" />
              </label>
            </div>
          </div>

          {/* Cover */}
          <div className="space-y-2">
            <Label className="text-[hsl(43_65%_52%)]">Front Cover JPG MANDATORY *</Label>
            <p className="text-xs text-muted-foreground">
              Auto optimized to WebP via Cloudinary CDN
            </p>
            <div className="flex gap-4 items-start">
              <div className="w-24 h-32 rounded-md overflow-hidden bg-[hsl(0_0%_10%)] flex items-center justify-center border border-[hsl(43_30%_25%)]">
                {coverPreview || coverUrl? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverPreview || coverUrl || ''} alt="Cover preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-[hsl(43_30%_25%)] rounded-lg hover:border-[hsl(43_65%_52%)] transition-all text-sm">
                  <ImageIcon className="h-4 w-4 text-[hsl(43_65%_52%)]" />
                  {coverFile? coverFile.name : 'Choose Cover JPG'}
                </div>
                <input type="file" accept=".jpg,.jpeg,image/jpeg" onChange={handleCoverChange} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Preview Settings */}
        <div className="black-gold-card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold">Preview Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preview Start Page</Label>
              <Input
                type="number"
                value={previewStart}
                onChange={(e) => setPreviewStart(e.target.value)}
                min="1"
                className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)]"
              />
            </div>
            <div className="space-y-2">
              <Label>Preview End Page</Label>
              <Input
                type="number"
                value={previewEnd}
                onChange={(e) => setPreviewEnd(e.target.value)}
                min="1"
                className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)]"
              />
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="black-gold-card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold">Metadata</h2>

          <div className="space-y-2">
            <Label>ISBN</Label>
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <Input
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-0000000000"
                className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)]"
              />
              <a href="https://isbn.international/" target="_blank" rel="noopener noreferrer" className="text-xs text-[hsl(43_65%_52%)] hover:underline whitespace-nowrap">
                isbn.international
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Publisher</Label>
            <Input
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)]"
            />
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <Label>Language (up to 2)</Label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    selectedLanguages.includes(lang)
                     ? 'bg-[hsl(43_65%_52%)]/10 text-[hsl(43_65%_52%)] border border-[hsl(43_65%_52%)]/30'
                      : 'text-muted-foreground border border-transparent hover:bg-[hsl(0_0%_12%)]'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label>Category (up to 2)</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    selectedCategories.includes(cat)
                     ? 'bg-[hsl(43_65%_52%)]/10 text-[hsl(43_65%_52%)] border border-[hsl(43_65%_52%)]/30'
                      : 'text-muted-foreground border border-transparent hover:bg-[hsl(0_0%_12%)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Descriptions */}
        <div className="black-gold-card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold">About & Description</h2>

          <div className="space-y-2">
            <Label>About Authors</Label>
            <Textarea
              value={aboutAuthors}
              onChange={(e) => setAboutAuthors(e.target.value)}
              placeholder="About the authors..."
              className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)]"
            />
          </div>

          <div className="space-y-2">
            <Label>Book Description</Label>
            <FairyQuote size="sm" className="mb-2" />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Book description..."
              className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)]"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 sticky bottom-4">
          <Button
            type="submit"
            disabled={saving}
            variant="outline"
            className="flex-1 border-[hsl(43_30%_25%)] hover:border-[hsl(43_65%_52%)] h-12"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving? 'Saving...' : 'Save Draft'}
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'published')}
            className="flex-1 gold-gradient text-black font-semibold hover:glow-gold h-12"
          >
            <Send className="h-4 w-4 mr-2" />
            {saving? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </form>
    </div>
  );
}