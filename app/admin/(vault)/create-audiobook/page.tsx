'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Headphones, Upload, Save, Send, Plus, X, IndianRupee, FileText, ImageIcon, Trash2, Music, Shield } from 'lucide-react';
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

// ✅ FIXED: Direct to Cloudinary - BYPASSES Vercel 4MB limit
async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  // 1. Get signed signature from your backend
  const isAudio = file.type.startsWith('audio/') || file.name.endsWith('.mp3');
  const resourceType = isAudio? 'video' : 'image';

  const signRes = await fetch(`/api/cloudinary/sign?folder=${encodeURIComponent(folder)}&resource_type=${resourceType}`);
  if (!signRes.ok) {
    const txt = await signRes.text();
    throw new Error(`Sign failed: ${txt.slice(0,200)}`);
  }
  const { timestamp, signature, apiKey, cloudName } = await signRes.json();

  // 2. Upload DIRECT to Cloudinary (25GB, no Vercel limit)
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
  catch { throw new Error(`Cloudinary error: ${text.slice(0,300)}`); }

  if (!res.ok) throw new Error(data.error?.message || 'Cloudinary upload failed');
  return data.secure_url as string; // https://res.cloudinary.com/bo6e8eui/video/upload/...
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
  function addChapter() {
    if (chapters.length >= 15) { toast.error('Max 15'); return; }
    setChapters([...chapters, { id: Date.now().toString(), title: '', file: null, fileName: '', existingPath: null, isExisting: false }]);
  }
  function removeChapter(id: string) { if (chapters.length <= 1) return; setChapters(chapters.filter((c) => c.id!== id)); }
  function updateChapter(id: string, field: 'title' | 'file' | 'fileName', value: string | File | null) {
    setChapters(chapters.map((c) => {
      if (c.id === id) {
        if (field === 'file') return {...c, file: value as File, fileName: (value as File)?.name || '', isExisting: false };
        return {...c, [field]: value };
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
    if (!openingFile &&!existingOpening) { toast.error('Opening required'); return; }
    if (!endingFile &&!existingEnding) { toast.error('Ending required'); return; }
    for (let i = 0; i < chapters.length; i++) { if (!chapters[i].title.trim()) { toast.error(`Chapter ${i+1} title required`); return; } if (!chapters[i].file &&!chapters[i].existingPath) { toast.error(`Chapter ${i+1} MP3 required`); return; } }

    setSaving(true);
    try {
      let uploadedCoverUrl = coverUrl;
      if (coverFile) { toast.loading('Uploading cover to Cloudinary...'); uploadedCoverUrl = await uploadToCloudinary(coverFile, 'vels-books/audiobook-covers'); toast.dismiss(); }
      const openingPublicUrl = openingFile? await uploadToCloudinary(openingFile, 'vels-books/audiobooks/opening') : existingOpening;
      const endingPublicUrl = endingFile? await uploadToCloudinary(endingFile, 'vels-books/audiobooks/ending') : existingEnding;
      const samplePublicUrl = sampleAudioFile? await uploadToCloudinary(sampleAudioFile, 'vels-books/audiobooks/sample') : existingSample;

      const chapterFolder = `vels-books/audiobooks/chapters/${editId || Date.now()}`;
      const chapterUploads: { title: string; mp3_url: string; chapter_no: number }[] = [];
      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        toast.loading(`Uploading Ch ${i+1}/${chapters.length} to Cloudinary...`);
        const mp3Url = ch.file? await uploadToCloudinary(ch.file, chapterFolder) : ch.existingPath!;
        chapterUploads.push({ title: ch.title.trim(), mp3_url: mp3Url, chapter_no: i+1 });
        toast.dismiss();
      }

      const audiobookData = { title: title.trim(), authors, cover_url: uploadedCoverUrl, mrp: parseInt(mrp, 10) || 0, description: description.trim() || null, opening_url: openingPublicUrl, ending_url: endingPublicUrl, sample_audio_url: samplePublicUrl, status, sku: `AB-${Date.now().toString().slice(-6)}` };
      let newBook: any = null;
      if (editId) { const r = await supabase.from('audiobooks').update(audiobookData).eq('id', editId).select('id').single(); if (r.error) throw new Error(r.error.message); newBook = r.data; }
      else { const r = await supabase.from('audiobooks').insert(audiobookData).select('id').single(); if (r.error) throw new Error(r.error.message); newBook = r.data; }
      if (!newBook?.id) throw new Error('Save failed');

      if (editId) await supabase.from('audio_chapters').delete().eq('audiobook_id', newBook.id);
      const inserts = chapterUploads.map((c) => ({ audiobook_id: newBook.id, chapter_no: c.chapter_no, title: c.title, mp3_url: c.mp3_url, duration: 0 }));
      const { error: chapterError } = await supabase.from('audio_chapters').insert(inserts);
      if (chapterError) throw new Error(chapterError.message);

      toast.success(`Published to Cloudinary! ${inserts.length} ch - ${(inserts.length*20).toFixed(0)}MB to 25GB`);
      router.push('/admin/mybooks');
    } catch (err: any) { console.error(err); toast.error(err.message); }
    finally { setSaving(false); toast.dismiss(); }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3"><CoinLogo size={36} /><div><h1 className="font-serif text-2xl gold-text font-bold">{editId? 'Edit Audiobook' : 'Create Audiobook (Cloudinary 25GB)'}</h1><p className="text-xs text-muted-foreground">Direct to Cloudinary — No Vercel 4MB limit!</p></div></div>
      <form onSubmit={(e) => handleSubmit(e, 'draft')} className="space-y-6">
        <div className="black-gold-card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold flex items-center gap-2"><Headphones className="h-4 w-4 text-[hsl(43_65%_52%)]" />Info</h2>
          <div className="space-y-2"><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div className="space-y-2"><Label>MRP *</Label><Input type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} required /></div>
        </div>
        <div className="black-gold-card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold">Uploads → Direct Cloudinary</h2>
          <div className="space-y-2"><Label>Cover JPG *</Label><input type="file" accept=".jpg,.jpeg,image/*" onChange={handleCoverChange} /></div>
          <div className="space-y-2"><Label>Opening *</Label><input type="file" accept=".mp3,audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setOpeningFile(f); setOpeningName(f.name); } }} /></div>
          <div className="space-y-2"><Label>Ending *</Label><input type="file" accept=".mp3,audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEndingFile(f); setEndingName(f.name); } }} /></div>
        </div>
        <div className="gold-border rounded-xl p-6 space-y-4 bg-[hsl(0_0%_5%)]">
          <h2 className="font-serif text-xl font-bold gold-text">Chapters (15) → 300MB Cloudinary</h2>
          {chapters.map((c, idx) => (
            <div key={c.id} className="flex gap-2 p-2 bg-[hsl(0_0%_8%)] rounded">
              <Input value={c.title} onChange={(e) => updateChapter(c.id, 'title', e.target.value)} placeholder={`Chapter ${idx+1} title`} />
              <input type="file" accept=".mp3,audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) updateChapter(c.id, 'file', f); }} />
              {chapters.length > 1 && <button type="button" onClick={() => removeChapter(c.id)}><Trash2 className="h-4 w-4" /></button>}
            </div>
          ))}
          <Button type="button" onClick={addChapter} size="sm">+ Add Chapter</Button>
        </div>
        <div className="black-gold-card p-6"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description..." /></div>
        <div className="flex gap-4"><Button type="submit" disabled={saving} variant="outline" className="flex-1">{saving? 'Uploading...' : 'Save Draft'}</Button><Button type="button" disabled={saving} onClick={(e) => handleSubmit(e as any, 'published')} className="flex-1 gold-gradient text-black">{saving? 'Publishing...' : 'Publish to Cloudinary 25GB'}</Button></div>
      </form>
    </div>
  );
}