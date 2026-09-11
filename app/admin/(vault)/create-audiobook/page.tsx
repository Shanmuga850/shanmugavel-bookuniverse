'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Headphones,
  Upload,
  Save,
  Send,
  Plus,
  X,
  IndianRupee,
  FileText,
  ImageIcon,
  Trash2,
  Music,
  Shield,
} from 'lucide-react';
import { CoinLogo } from '@/components/branding/coin-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FairyQuote } from '@/components/branding/fairy-quote';
import { supabase } from '@/lib/supabase-client';
import { VELS } from '@/lib/constants';
import { toast } from 'sonner';

interface ChapterInput {
  id: string;
  title: string;
  file: File | null;
  fileName: string;
  existingPath: string | null;
  isExisting: boolean;
}

export default function CreateAudiobookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState<string[]>(['Shanmugavel M']);
  const [newAuthor, setNewAuthor] = useState('');
  const [mrp, setMrp] = useState('');
  const [ebookLink, setEbookLink] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [pdfRefFile, setPdfRefFile] = useState<File | null>(null);
  const [pdfRefName, setPdfRefName] = useState('');
  const [sampleAudioFile, setSampleAudioFile] = useState<File | null>(null);
  const [sampleAudioName, setSampleAudioName] = useState('');
  const [openingFile, setOpeningFile] = useState<File | null>(null);
  const [openingName, setOpeningName] = useState('');
  const [endingFile, setEndingFile] = useState<File | null>(null);
  const [endingName, setEndingName] = useState('');
  const [chapters, setChapters] = useState<ChapterInput[]>([
    { id: '1', title: '', file: null, fileName: '', existingPath: null, isExisting: false },
    { id: '2', title: '', file: null, fileName: '', existingPath: null, isExisting: false },
    { id: '3', title: '', file: null, fileName: '', existingPath: null, isExisting: false },
  ]);
  const [existingOpening, setExistingOpening] = useState<string | null>(null);
  const [existingEnding, setExistingEnding] = useState<string | null>(null);
  const [existingSample, setExistingSample] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editId) loadBook(editId);
  }, [editId]);

  async function loadBook(id: string) {
    const { data } = await supabase.from('audiobooks').select('*').eq('id', id).maybeSingle();
    if (data) {
      setTitle(data.title || '');
      setAuthors(data.authors || ['Shanmugavel M']);
      setMrp(String(data.mrp || ''));
      setDescription(data.description || '');
      setCoverUrl(data.cover_url || null);
      if (data.opening_url) setExistingOpening(data.opening_url);
      if (data.ending_url) setExistingEnding(data.ending_url);
      if (data.sample_audio_url) setExistingSample(data.sample_audio_url);
    }
    const { data: chaps } = await supabase
      .from('audio_chapters')
      .select('*')
      .eq('audiobook_id', id)
      .order('chapter_no', { ascending: true });
    if (chaps && chaps.length > 0) {
      setChapters(
        chaps.map((c) => ({
          id: c.id,
          title: c.title || '',
          file: null,
          fileName: '',
          existingPath: c.mp3_url || null,
          isExisting: !!c.mp3_url,
        }))
      );
    }
  }

  function addAuthor() {
    if (newAuthor.trim()) {
      setAuthors([...authors, newAuthor.trim()]);
      setNewAuthor('');
    }
  }

  function addChapter() {
    if (chapters.length >= 15) {
      toast.error('Maximum 15 chapters allowed');
      return;
    }
    setChapters([
      ...chapters,
      { id: Date.now().toString(), title: '', file: null, fileName: '', existingPath: null, isExisting: false },
    ]);
  }

  function removeChapter(id: string) {
    if (chapters.length <= 1) return;
    setChapters(chapters.filter((c) => c.id !== id));
  }

  function updateChapter(id: string, field: 'title' | 'file' | 'fileName', value: string | File | null) {
    setChapters(chapters.map((c) => {
      if (c.id === id) {
        if (field === 'file') {
          return { ...c, file: value as File, fileName: (value as File)?.name || '', isExisting: false };
        }
        return { ...c, [field]: value };
      }
      return c;
    }));
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

  async function uploadAudio(bucket: string, file: File, path: string): Promise<string | null> {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      contentType: file.type || 'audio/mpeg',
    });
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    return path;
  }

  async function uploadCover(file: File): Promise<string | null> {
    const path = `covers/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('book-covers').upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (error) return null;
    const { data: urlData } = supabase.storage.from('book-covers').getPublicUrl(path);
    return urlData.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent, status: 'draft' | 'published') {
    e.preventDefault();
    console.log('Create Audiobook form submitted. Status:', status);

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!mrp.trim()) {
      toast.error('MRP is required');
      return;
    }

    setSaving(true);

    try {
      let uploadedCoverUrl = coverUrl;
      if (coverFile) {
        uploadedCoverUrl = await uploadCover(coverFile);
        if (!uploadedCoverUrl) {
          toast.error('Failed to upload cover');
          setSaving(false);
          return;
        }
      }

      let uploadedOpeningUrl: string | null = existingOpening;
      if (openingFile) {
        uploadedOpeningUrl = await uploadAudio('audiobook-files', openingFile, `opening/${Date.now()}-${openingFile.name}`);
        if (!uploadedOpeningUrl) {
          toast.error('Failed to upload Opening Credits');
          setSaving(false);
          return;
        }
      }

      let uploadedEndingUrl: string | null = existingEnding;
      if (endingFile) {
        uploadedEndingUrl = await uploadAudio('audiobook-files', endingFile, `ending/${Date.now()}-${endingFile.name}`);
        if (!uploadedEndingUrl) {
          toast.error('Failed to upload Ending Credits');
          setSaving(false);
          return;
        }
      }

      let uploadedSampleUrl: string | null = existingSample;
      if (sampleAudioFile) {
        uploadedSampleUrl = await uploadAudio('audiobook-files', sampleAudioFile, `sample/${Date.now()}-${sampleAudioFile.name}`);
      }

      const audiobookData = {
        title: title.trim(),
        authors,
        cover_url: uploadedCoverUrl,
        mrp: parseInt(mrp) || 0,
        description: description.trim() || null,
        opening_url: uploadedOpeningUrl,
        ending_url: uploadedEndingUrl,
        sample_audio_url: uploadedSampleUrl,
        status,
        sku: `AB-${Date.now().toString().slice(-6)}`,
      };

      let result;
      if (editId) {
        result = await supabase.from('audiobooks').update(audiobookData).eq('id', editId).select().maybeSingle();
      } else {
        result = await supabase.from('audiobooks').insert(audiobookData).select().maybeSingle();
      }

      if (result.error) {
        toast.error(`Failed to save: ${result.error.message}`);
        setSaving(false);
        return;
      }

      const audiobookId = result.data?.id;
      if (!audiobookId) {
        toast.error('Failed to get audiobook ID');
        setSaving(false);
        return;
      }

      // Upload replacement chapter files before removing existing edit rows.
      const chapterInserts: { audiobook_id: string; chapter_no: number; title: string; mp3_url: string | null; duration: number }[] = [];
      for (let idx = 0; idx < chapters.length; idx++) {
        const c = chapters[idx];
        const chapterTitle = c.title.trim();
        if (!chapterTitle && !c.file && !c.existingPath) continue;
        if (!chapterTitle) {
          toast.error(`Chapter ${idx + 1} title is required`);
          setSaving(false);
          return;
        }
        if (!c.file && !c.existingPath) {
          toast.error(`Choose an MP3 for Chapter ${idx + 1}`);
          setSaving(false);
          return;
        }

        let finalPath: string | null = c.existingPath;
        if (c.file) {
          const uploadPath = `chapters/${audiobookId}/${Date.now()}-${idx}-${c.file.name.replace(/\s/g, '-')}`;
          const { error: chUploadError } = await supabase.storage
            .from('audiobook-files')
            .upload(uploadPath, c.file, {
              upsert: true,
              contentType: c.file.type || 'audio/mpeg',
            });
          if (chUploadError) {
            console.error('Chapter upload error:', chUploadError);
            toast.error(`Failed to upload chapter ${idx + 1}: ${chUploadError.message}`);
            setSaving(false);
            return;
          }
          finalPath = uploadPath;
        }

        chapterInserts.push({
          audiobook_id: audiobookId,
          chapter_no: idx + 1,
          title: chapterTitle,
          mp3_url: finalPath,
          duration: 0,
        });
      }

      if (editId) {
        const { error: deleteError } = await supabase
          .from('audio_chapters')
          .delete()
          .eq('audiobook_id', editId);
        if (deleteError) {
          toast.error(`Failed to replace chapters: ${deleteError.message}`);
          setSaving(false);
          return;
        }
      }

      if (chapterInserts.length > 0) {
        const { error: chInsertError } = await supabase.from('audio_chapters').insert(chapterInserts);
        if (chInsertError) {
          console.error('Chapter insert error:', chInsertError);
          toast.error(`Failed to save chapters: ${chInsertError.message}`);
          setSaving(false);
          return;
        }
      }

      toast.success(status === 'published' ? 'Audiobook Published!' : 'Draft saved');
      router.push('/admin/mybooks');
      router.refresh();
    } catch (err) {
      console.error('Exception:', err);
      toast.error('An error occurred');
    }

    setSaving(false);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <CoinLogo size={36} />
        <div>
          <h1 className="font-serif text-2xl gold-text font-bold">
            {editId ? 'Edit Audiobook' : 'Create Audiobook'}
          </h1>
          <p className="text-xs text-muted-foreground">Howler.js Protected — PLAY ONLY</p>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, 'draft')} className="space-y-6">
        {/* Basic Info */}
        <div className="black-gold-card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold flex items-center gap-2">
            <Headphones className="h-4 w-4 text-[hsl(43_65%_52%)]" />
            Audiobook Information
          </h2>

          <div className="space-y-2">
            <Label className="text-[hsl(43_65%_52%)]">Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter audiobook title"
              required
              className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)]"
            />
          </div>

          <div className="space-y-2">
            <Label>Authors</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {authors.map((author, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 bg-[hsl(43_65%_52%)]/10 text-[hsl(43_65%_52%)] text-sm px-3 py-1 rounded-full">
                  {author}
                  {authors.length > 1 && (
                    <button type="button" onClick={() => setAuthors(authors.filter((_, i) => i !== idx))}>
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
                placeholder="Add author"
                className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)]"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAuthor(); } }}
              />
              <Button type="button" onClick={addAuthor} variant="outline" className="border-[hsl(43_30%_25%)]">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[hsl(43_65%_52%)]">MRP (Rs) *</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                placeholder="399"
                required
                className="pl-9 bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>eBook Link (Optional)</Label>
            <Input
              value={ebookLink}
              onChange={(e) => setEbookLink(e.target.value)}
              placeholder="Link to corresponding eBook ID"
              className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)]"
            />
          </div>
        </div>

        {/* Files */}
        <div className="black-gold-card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold flex items-center gap-2">
            <Upload className="h-4 w-4 text-[hsl(43_65%_52%)]" />
            Upload Files
          </h2>

          {/* PDF Reference */}
          <div className="space-y-2">
            <Label className="text-[hsl(43_65%_52%)]">PDF Reference MANDATORY * (verification only, not for readers)</Label>
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-[hsl(43_30%_25%)] rounded-lg hover:border-[hsl(43_65%_52%)] text-sm w-fit">
                <FileText className="h-4 w-4 text-[hsl(43_65%_52%)]" />
                {pdfRefFile ? pdfRefFile.name : pdfRefName || 'Choose PDF Reference'}
              </div>
              <input type="file" accept=".pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPdfRefFile(f); setPdfRefName(f.name); } }} className="hidden" />
            </label>
          </div>

          {/* Cover */}
          <div className="space-y-2">
            <Label className="text-[hsl(43_65%_52%)]">Cover JPG MANDATORY *</Label>
            <div className="flex gap-4 items-start">
              <div className="w-24 h-32 rounded-md overflow-hidden bg-[hsl(0_0%_10%)] flex items-center justify-center border border-[hsl(43_30%_25%)]">
                {coverPreview || coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverPreview || coverUrl || ''} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-[hsl(43_30%_25%)] rounded-lg hover:border-[hsl(43_65%_52%)] text-sm w-fit">
                  <ImageIcon className="h-4 w-4 text-[hsl(43_65%_52%)]" />
                  {coverFile ? coverFile.name : 'Choose Cover JPG'}
                </div>
                <input type="file" accept=".jpg,.jpeg,image/jpeg" onChange={handleCoverChange} className="hidden" />
              </label>
            </div>
          </div>

          {/* Sample Audio */}
          <div className="space-y-2">
            <Label>Sample Audio (Optional, MP3)</Label>
            {existingSample && !sampleAudioFile && (
              <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
                <span>Already uploaded. Leave empty to keep, or choose new MP3 to replace.</span>
              </div>
            )}
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-[hsl(43_30%_25%)] rounded-lg hover:border-[hsl(43_65%_52%)] text-sm w-fit">
                <Music className="h-4 w-4 text-[hsl(43_65%_52%)]" />
                {sampleAudioFile ? sampleAudioFile.name : sampleAudioName || (existingSample ? 'Choose new MP3 to replace' : 'Choose Sample MP3 (30s-5min)')}
              </div>
              <input type="file" accept=".mp3,audio/mpeg" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setSampleAudioFile(f); setSampleAudioName(f.name); } }} className="hidden" />
            </label>
          </div>
        </div>

        {/* Audio Structure - Gold border BIG BOX */}
        <div className="gold-border rounded-xl p-6 space-y-6 bg-[hsl(0_0%_5%)]">
          <h2 className="font-serif text-xl font-bold gold-text flex items-center gap-2">
            <Music className="h-5 w-5" />
            Audio Structure
          </h2>

          {/* Opening Credits */}
          <div className="space-y-2">
            <Label className="text-[hsl(43_65%_52%)]">Opening Credits — MANDATORY *</Label>
            {existingOpening && !openingFile && (
              <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
                <span>Already uploaded. Leave empty to keep, or choose new MP3 to replace.</span>
              </div>
            )}
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-[hsl(43_30%_25%)] rounded-lg hover:border-[hsl(43_65%_52%)] text-sm w-fit">
                <Music className="h-4 w-4 text-[hsl(43_65%_52%)]" />
                {openingFile ? openingFile.name : openingName || (existingOpening ? 'Choose new MP3 to replace' : 'Choose Opening Credits MP3')}
              </div>
              <input type="file" accept=".mp3,audio/mpeg" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setOpeningFile(f); setOpeningName(f.name); } }} className="hidden" />
            </label>
          </div>

          {/* Chapters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[hsl(43_65%_52%)]">Chapters (Max 15)</Label>
              <Button type="button" onClick={addChapter} size="sm" variant="outline" className="border-[hsl(43_30%_25%)]">
                <Plus className="h-3 w-3 mr-1" /> Add Chapter
              </Button>
            </div>
            {chapters.map((chapter, idx) => (
              <div key={chapter.id} className="flex gap-3 items-start p-3 rounded-lg bg-[hsl(0_0%_8%)] border border-[hsl(43_30%_25%)]">
                <span className="text-sm font-mono text-[hsl(43_65%_52%)] mt-2.5 w-6">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 space-y-2">
                  <Input
                    value={chapter.title}
                    onChange={(e) => updateChapter(chapter.id, 'title', e.target.value)}
                    placeholder={`Chapter ${idx + 1} title`}
                    className="bg-[hsl(0_0%_5%)] border-[hsl(43_30%_25%)]"
                  />
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-[hsl(43_30%_25%)] rounded-lg hover:border-[hsl(43_65%_52%)] text-xs w-fit">
                      <Music className="h-3 w-3 text-[hsl(43_65%_52%)]" />
                      {chapter.fileName || (chapter.isExisting ? 'Choose new MP3 to replace' : 'Choose MP3')}
                    </div>
                    <input type="file" accept=".mp3,audio/mpeg" onChange={(e) => { const f = e.target.files?.[0]; if (f) updateChapter(chapter.id, 'file', f); }} className="hidden" />
                  </label>
                  {chapter.isExisting && (
                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <span>Already uploaded — leave empty to keep existing file</span>
                    </div>
                  )}
                </div>
                {chapters.length > 1 && (
                  <button type="button" onClick={() => removeChapter(chapter.id)} className="text-muted-foreground hover:text-red-400 p-2">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Ending Credits */}
          <div className="space-y-2">
            <Label className="text-[hsl(43_65%_52%)]">Ending Credits — MANDATORY *</Label>
            {existingEnding && !endingFile && (
              <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
                <span>Already uploaded. Leave empty to keep, or choose new MP3 to replace.</span>
              </div>
            )}
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-[hsl(43_30%_25%)] rounded-lg hover:border-[hsl(43_65%_52%)] text-sm w-fit">
                <Music className="h-4 w-4 text-[hsl(43_65%_52%)]" />
                {endingFile ? endingFile.name : endingName || (existingEnding ? 'Choose new MP3 to replace' : 'Choose Ending Credits MP3')}
              </div>
              <input type="file" accept=".mp3,audio/mpeg" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEndingFile(f); setEndingName(f.name); } }} className="hidden" />
            </label>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-[hsl(43_65%_52%)]/5">
            <Shield className="h-4 w-4 text-[hsl(43_65%_52%)]" />
            <p className="text-xs text-muted-foreground">Howler.js Protected — PLAY ONLY. No native controls, no src exposure.</p>
          </div>
        </div>

        {/* Description */}
        <div className="black-gold-card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold">Description</h2>
          <FairyQuote size="sm" className="mb-2" />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Audiobook description..."
            className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)]"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 sticky bottom-4">
          <Button type="submit" disabled={saving} variant="outline" className="flex-1 border-[hsl(43_30%_25%)] hover:border-[hsl(43_65%_52%)] h-12">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'published')}
            className="flex-1 gold-gradient text-black font-semibold hover:glow-gold h-12"
          >
            <Send className="h-4 w-4 mr-2" />
            {saving ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </form>
    </div>
  );
}
