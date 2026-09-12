'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Headphones, Upload, Save, Send, Plus, X, IndianRupee, ImageIcon, Trash2, Music, Shield } from 'lucide-react';
import { CoinLogo } from '@/components/branding/coin-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FairyQuote } from '@/components/branding/fairy-quote';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

interface ChapterInput {
  id: string;
  title: string;
  file: File | null;
  fileName: string;
  existingPath: string | null;
  isExisting: boolean;
}

// ✅ FINAL: Direct to Cloudinary - bypass Vercel 4MB
async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  const isAudio = file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3');
  const resourceType = isAudio? 'video' : 'image';

  const signRes = await fetch(`/api/cloudinary/sign?folder=${encodeURIComponent(folder)}&resource_type=${resourceType}`);
  if (!signRes.ok) {
    const txt = await signRes.text();
    throw new Error(`Sign failed: ${txt.slice(0, 200)}`);
  }
  const { timestamp, signature, apiKey, cloudName } = await signRes.json();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const res = await fetch(uploadUrl, { method: 'POST', body: formData });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); }
  catch { throw new Error(`Cloudinary error: ${text.slice(0, 300)}`); }
  if (!res.ok) throw new Error(data.error?.message || 'Cloudinary upload failed');
  return data.secure_url as string;
}

export default function CreateAudiobookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState<string[]>(['Shanmugavel M']);
  const [newAuthor, setNewAuthor] = useState('');
  const [mrp, setMrp] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
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

  useEffect(() => { if (editId) loadBook(editId); }, [editId]);

  async function loadBook(id: string) {
    const { data } = await supabase.from('audiobooks').select('*').eq('id', id).maybeSingle();
    if (!data) { router.push('/admin/mybooks'); return; }
    setTitle(data.title || ''); setAuthors(data.authors || ['Shanmugavel M']);
    setMrp(String(data.mrp || '')); setDescription(data.description || '');
    setCoverUrl(data.cover_url || null);
    if (data.opening_url) setExistingOpening(data.opening_url);
    if (data.ending_url) setExistingEnding(data.ending_url);
    if (data.sample_audio_url) setExistingSample(data.sample_audio_url);
    const { data: chaps } = await supabase.from('audio_chapters').select('*').eq('audiobook_id', id).order('chapter_no');
    if (chaps?.length) setChapters(chaps.map((c: any) => ({ id: c.id, title: c.title || '', file: null, fileName: '', existingPath: c.mp3_url || null, isExisting:!!c.mp3_url })));
  }

  function addAuthor() { if (newAuthor.trim()) { setAuthors([...authors, newAuthor.trim()]); setNewAuthor(''); } }
  function addChapter() { if (chapters.length >= 15) { toast.error('Maximum 15 chapters'); return; } setChapters([...chapters, { id: Date.now().toString(), title: '', file: null, fileName: '', existingPath: null, isExisting: false }]); }
  function removeChapter(id: string) { if (chapters.length <= 1) return; setChapters(chapters.filter((c) => c.id!== id)); }
  function updateChapter(id: string, field: 'title' | 'file', value: string | File | null) {
    setChapters(chapters.map((c) => {
      if (c.id === id) {
        if (field === 'file') return {...c, file: value as File, fileName: (value as File)?.name || '', isExisting: false };
        return {...c, title: value as string };
      }
      return c;
    }));
  }
  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setCoverFile(file);
    const reader = new FileReader(); reader.onload = (ev) => setCoverPreview(ev.target?.result as string); reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent, status: 'draft' | 'published') {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title required'); return; }
    if (!mrp.trim()) { toast.error('MRP required'); return; }
    if (!openingFile &&!existingOpening) { toast.error('Opening Credits mandatory'); return; }
    if (!endingFile &&!existingEnding) { toast.error('Ending Credits mandatory'); return; }
    for (let i = 0; i < chapters.length; i++) { if (!chapters[i].title.trim()) { toast.error(`Chapter ${i + 1} title required`); return; } if (!chapters[i].file &&!chapters[i].existingPath) { toast.error(`Chapter ${i + 1} MP3 required`); return; } }

    setSaving(true);
    try {
      let uploadedCoverUrl = coverUrl;
      if (coverFile) { toast.loading('Uploading cover to Cloudinary...'); uploadedCoverUrl = await uploadToCloudinary(coverFile, 'vels-books/audiobook-covers'); toast.dismiss(); }

      toast.loading('Uploading Opening to Cloudinary...');
      const openingPublicUrl = openingFile? await uploadToCloudinary(openingFile, 'vels-books/audiobooks/opening') : existingOpening;
      toast.dismiss();

      toast.loading('Uploading Ending to Cloudinary...');
      const endingPublicUrl = endingFile? await uploadToCloudinary(endingFile, 'vels-books/audiobooks/ending') : existingEnding;
      toast.dismiss();

      toast.loading('Uploading Sample to Cloudinary...');
      const samplePublicUrl = sampleAudioFile? await uploadToCloudinary(sampleAudioFile, 'vels-books/audiobooks/sample') : existingSample;
      toast.dismiss();

      const chapterFolder = `vels-books/audiobooks/chapters/${editId || Date.now()}`;
      const chapterUploads: { title: string; mp3_url: string; chapter_no: number }[] = [];
      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        toast.loading(`Uploading Chapter ${i + 1}/${chapters.length} to Cloudinary...`);
        const mp3Url = ch.file? await uploadToCloudinary(ch.file, chapterFolder) : ch.existingPath!;
        chapterUploads.push({ title: ch.title.trim(), mp3_url: mp3Url, chapter_no: i + 1 });
        toast.dismiss();
      }

      const audiobookData = {
        title: title.trim(), authors, cover_url: uploadedCoverUrl, mrp: parseInt(mrp, 10) || 0,
        description: description.trim() || null, opening_url: openingPublicUrl, ending_url: endingPublicUrl,
        sample_audio_url: samplePublicUrl, status, sku: `AB-${Date.now().toString().slice(-6)}`,
      };

      let newBook: any = null;
      if (editId) { const r = await supabase.from('audiobooks').update(audiobookData).eq('id', editId).select('id').single(); if (r.error) throw new Error(r.error.message); newBook = r.data; }
      else { const r = await supabase.from('audiobooks').insert(audiobookData).select('id').single(); if (r.error) throw new Error(r.error.message); newBook = r.data; }

      if (editId) await supabase.from('audio_chapters').delete().eq('audiobook_id', newBook.id);
      const inserts = chapterUploads.map((c) => ({ audiobook_id: newBook.id, chapter_no: c.chapter_no, title: c.title, mp3_url: c.mp3_url, duration: 0 }));
      const { error } = await supabase.from('audio_chapters').insert(inserts);
      if (error) throw new Error(error.message);

      toast.success(`Published to Cloudinary 25GB! ${inserts.length} chapters`);
      router.push('/admin/mybooks');
    } catch (err: any) { console.error(err); toast.error(err.message); }
    finally { setSaving(false); toast.dismiss(); }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3"><CoinLogo size={36} /><div><h1 className="font-serif text-2xl gold-text font-bold">{editId? 'Edit Audiobook' : 'Create Audiobook (Cloudinary 25GB)'}</h1><p className="text-xs text-muted-foreground">Direct to Cloudinary — No Vercel 4MB limit!</p></div></div>

      <form onSubmit={(e) => handleSubmit(e, 'draft')} className="space-y-6">
        <div className="black-gold-card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold flex items-center gap-2"><Headphones className="h-4 w-4 text-[hsl(43_65%_52%)]" />Audiobook Information</h2>
          <div className="space-y-2"><Label className="text-[hsl(43_65%_52%)]">Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title" required className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)]" /></div>
          <div className="space-y-2"><Label>Authors</Label><div className="flex flex-wrap gap-2 mb-2">{authors.map((author, idx) => (<span key={idx} className="inline-flex items-center gap-1 bg-[hsl(43_65%_52%)]/10 text-[hsl(43_65%_52%)] text-sm px-3 py-1 rounded-full">{author}{authors.length > 1 && (<button type="button" onClick={() => setAuthors(authors.filter((_, i) => i!== idx))}><X className="h-3 w-3" /></button>)}</span>))}</div><div className="flex gap-2"><Input value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} placeholder="Add author" className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)]" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAuthor(); } }} /><Button type="button" onClick={addAuthor} variant="outline" className="border-[hsl(43_30%_25%)]"><Plus className="h-4 w-4" /></Button></div></div>
          <div className="space-y-2"><Label className="text-[hsl(43_65%_52%)]">MRP (Rs) *</Label><div className="relative"><IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} placeholder="399" required className="pl-9 bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)]" /></div></div>
        </div>

        <div className="black-gold-card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold flex items-center gap-2"><Upload className="h-4 w-4 text-[hsl(43_65%_52%)]" />Uploads → Direct Cloudinary 25GB</h2>

          <div className="space-y-2"><Label className="text-[hsl(43_65%_52%)]">Cover JPG MANDATORY * → Cloudinary</Label><div className="flex gap-4 items-start"><div className="w-24 h-32 rounded-md overflow-hidden bg-[hsl(0_0%_10%)] flex items-center justify-center border border-[hsl(43_30%_25%)]">{coverPreview || coverUrl? (<img src={coverPreview || coverUrl || ''} alt="Cover" className="w-full h-full object-cover" />) : (<ImageIcon className="h-6 w-6 text-muted-foreground" />)}</div><label className="cursor-pointer"><div className="flex items-center gap-2 px-4 py-2 border border-dashed border-[hsl(43_30%_25%)] rounded-lg hover:border-[hsl(43_65%_52%)] text-sm w-fit"><ImageIcon className="h-4 w-4 text-[hsl(43_65%_52%)]" />{coverFile? coverFile.name : 'Choose Cover JPG'}</div><input type="file" accept=".jpg,.jpeg,image/jpeg" onChange={handleCoverChange} className="hidden" /></label></div></div>

          <div className="space-y-2"><Label>Sample Audio (Optional, MP3) → Cloudinary</Label><label className="cursor-pointer"><div className="flex items-center gap-2 px-4 py-2 border border-dashed border-[hsl(43_30%_25%)] rounded-lg hover:border-[hsl(43_65%_52%)] text-sm w-fit"><Music className="h-4 w-4 text-[hsl(43_65%_52%)]" />{sampleAudioFile? sampleAudioFile.name : sampleAudioName || (existingSample? 'Choose new MP3 to replace' : 'Choose Sample MP3')}</div><input type="file" accept=".mp3,audio/mpeg" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setSampleAudioFile(f); setSampleAudioName(f.name); } }} className="hidden" /></label></div>

          <div className="space-y-2"><Label className="text-[hsl(43_65%_52%)]">Opening Credits *</Label><label className="cursor-pointer"><div className="flex items-center gap-2 px-4 py-2 border border-dashed border-[hsl(43_30%_25%)] rounded-lg hover:border-[hsl(43_65%_52%)] text-sm w-fit"><Music className="h-4 w-4 text-[hsl(43_65%_52%)]" />{openingFile? openingFile.name : openingName || (existingOpening? 'Replace MP3' : 'Choose Opening MP3')}</div><input type="file" accept=".mp3,audio/mpeg" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setOpeningFile(f); setOpeningName(f.name); } }} className="hidden" /></label></div>

          <div className="space-y-2"><Label className="text-[hsl(43_65%_52%)]">Ending Credits *</Label><label className="cursor-pointer"><div className="flex items-center gap-2 px-4 py-2 border border-dashed border-[hsl(43_30%_25%)] rounded-lg hover:border-[hsl(43_65%_52%)] text-sm w-fit"><Music className="h-4 w-4 text-[hsl(43_65%_52%)]" />{endingFile? endingFile.name : endingName || (existingEnding? 'Replace MP3' : 'Choose Ending MP3')}</div><input type="file" accept=".mp3,audio/mpeg" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEndingFile(f); setEndingName(f.name); } }} className="hidden" /></label></div>
        </div>

        <div className="gold-border rounded-xl p-6 space-y-6 bg-[hsl(0_0%_5%)]">
          <h2 className="font-serif text-xl font-bold gold-text flex items-center gap-2"><Music className="h-5 w-5" />Audio Structure → 300MB to Cloudinary</h2>
          <div className="space-y-3"><div className="flex items-center justify-between"><Label className="text-[hsl(43_65%_52%)]">Chapters (Max 15) - Each goes to Cloudinary 25GB</Label><Button type="button" onClick={addChapter} size="sm" variant="outline" className="border-[hsl(43_30%_25%)]"><Plus className="h-3 w-3 mr-1" /> Add Chapter</Button></div>{chapters.map((chapter, idx) => (<div key={chapter.id} className="flex gap-3 items-start p-3 rounded-lg bg-[hsl(0_0%_8%)] border border-[hsl(43_30%_25%)]"><span className="text-sm font-mono text-[hsl(43_65%_52%)] mt-2.5 w-6">{String(idx + 1).padStart(2, '0')}</span><div className="flex-1 space-y-2"><Input value={chapter.title} onChange={(e) => updateChapter(chapter.id, 'title', e.target.value)} placeholder={`Chapter ${idx + 1} title`} className="bg-[hsl(0_0%_5%)] border-[hsl(43_30%_25%)]" /><label className="cursor-pointer"><div className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-[hsl(43_30%_25%)] rounded-lg hover:border-[hsl(43_65%_52%)] text-xs w-fit"><Music className="h-3 w-3 text-[hsl(43_65%_52%)]" />{chapter.fileName || (chapter.isExisting? 'Replace MP3' : 'Choose MP3')}</div><input type="file" accept=".mp3,audio/mpeg" onChange={(e) => { const f = e.target.files?.[0]; if (f) updateChapter(chapter.id, 'file', f); }} className="hidden" /></label></div>{chapters.length > 1 && (<button type="button" onClick={() => removeChapter(chapter.id)} className="text-muted-foreground hover:text-red-400 p-2"><Trash2 className="h-4 w-4" /></button>)}</div>))}</div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[hsl(43_65%_52%)]/5"><Shield className="h-4 w-4 text-[hsl(43_65%_52%)]" /><p className="text-xs text-muted-foreground">Cloudinary Streaming — 300MB per audiobook, 25GB = ~83 audiobooks free</p></div>
        </div>

        <div className="black-gold-card p-6 space-y-4"><h2 className="font-serif text-lg font-bold">Description</h2><FairyQuote size="sm" className="mb-2" /><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Audiobook description..." className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)]" /></div>

        <div className="flex gap-4 sticky bottom-4"><Button type="submit" disabled={saving} variant="outline" className="flex-1 border-[hsl(43_30%_25%)] h-12"><Save className="h-4 w-4 mr-2" />{saving? 'Uploading to Cloudinary...' : 'Save Draft'}</Button><Button type="button" disabled={saving} onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'published')} className="flex-1 gold-gradient text-black font-semibold h-12"><Send className="h-4 w-4 mr-2" />{saving? 'Publishing...' : 'Publish to Cloudinary 25GB'}</Button></div>
      </form>
    </div>
  );
}