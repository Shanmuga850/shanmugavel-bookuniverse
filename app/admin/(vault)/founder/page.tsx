'use client';

import { useState, useEffect } from 'react';
import { User, Save, Upload, CheckCircle, X, ImageIcon } from 'lucide-react';
import { CoinLogo } from '@/components/branding/coin-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FairyQuote } from '@/components/branding/fairy-quote';
import { supabase } from '@/lib/supabase-client';
import { VELS } from '@/lib/constants';
import { toast } from 'sonner';

export default function FounderProfilePage() {
  const [name, setName] = useState(VELS.founder.name);
  const [bio, setBio] = useState('');
  const [fairyQuote, setFairyQuote] = useState(VELS.fairyQuote);
  const [tagline, setTagline] = useState(VELS.founder.tagline);
  const [coinLogoUrl, setCoinLogoUrl] = useState<string | null>(null);
  const [coinLogoFile, setCoinLogoFile] = useState<File | null>(null);
  const [coinLogoPreview, setCoinLogoPreview] = useState<string | null>(null);
  const [img1Url, setImg1Url] = useState<string | null>(null);
  const [img1File, setImg1File] = useState<File | null>(null);
  const [img1Preview, setImg1Preview] = useState<string | null>(null);
  const [img2Url, setImg2Url] = useState<string | null>(null);
  const [img2File, setImg2File] = useState<File | null>(null);
  const [img2Preview, setImg2Preview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('founder_profile')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (data) {
        setName(data.name || VELS.founder.name);
        setBio(data.bio || '');
        setFairyQuote(data.fairy_quote || VELS.fairyQuote);
        setTagline(data.tagline || VELS.founder.tagline);
        setCoinLogoUrl(data.coin_logo_url || null);
        setImg1Url(data.founder_image_1_url || null);
        setImg2Url(data.founder_image_2_url || null);
      }
      setLoaded(true);
    }
    load();
  }, []);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCoinLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setCoinLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleImageChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (s: string | null) => void
  ) {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function uploadFounderImage(file: File): Promise<string | null> {
    const path = `author-images/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from('founder-images')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) return null;
    const { data: urlData } = supabase.storage.from('founder-images').getPublicUrl(path);
    return urlData.publicUrl;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    console.log('Saving founder profile...');

    try {
      let logoUrl = coinLogoUrl;
      if (coinLogoFile) {
        const path = `coin-logo/${Date.now()}-${coinLogoFile.name}`;
        const { error: upErr } = await supabase.storage
          .from('founder-assets')
          .upload(path, coinLogoFile, { upsert: true, contentType: coinLogoFile.type });
        if (upErr) {
          toast.error('Failed to upload coin logo');
          setSaving(false);
          return;
        }
        const { data: urlData } = supabase.storage.from('founder-assets').getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }

      let newImg1Url = img1Url;
      if (img1File) {
        newImg1Url = await uploadFounderImage(img1File);
        if (!newImg1Url) {
          toast.error('Failed to upload Author Image 1');
          setSaving(false);
          return;
        }
      }

      let newImg2Url = img2Url;
      if (img2File) {
        newImg2Url = await uploadFounderImage(img2File);
        if (!newImg2Url) {
          toast.error('Failed to upload Author Image 2');
          setSaving(false);
          return;
        }
      }

      const profileData = {
        id: 1,
        name,
        bio,
        fairy_quote: fairyQuote,
        tagline,
        coin_logo_url: logoUrl,
        founder_image_1_url: newImg1Url,
        founder_image_2_url: newImg2Url,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('founder_profile')
        .upsert(profileData, { onConflict: 'id' });

      if (error) {
        toast.error(`Failed to save: ${error.message}`);
      } else {
        toast.success('Founder Profile saved — reflects instantly on /about');
        setCoinLogoUrl(logoUrl);
        setCoinLogoFile(null);
        setCoinLogoPreview(null);
        setImg1Url(newImg1Url);
        setImg1File(null);
        setImg1Preview(null);
        setImg2Url(newImg2Url);
        setImg2File(null);
        setImg2Preview(null);
      }
    } catch (err) {
      console.error('Save error:', err);
      toast.error('An error occurred');
    }
    setSaving(false);
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <CoinLogo size={48} spinning />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <CoinLogo size={36} />
        <div>
          <h1 className="font-serif text-2xl gold-text font-bold">Founder Profile</h1>
          <p className="text-xs text-muted-foreground">Live on /about — changes reflect instantly</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Coin Logo Upload */}
        <div className="black-gold-card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold flex items-center gap-2">
            <User className="h-4 w-4 text-[hsl(43_65%_52%)]" />
            Coin Logo
          </h2>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full gold-border overflow-hidden flex items-center justify-center bg-[hsl(0_0%_8%)]">
              {coinLogoPreview || coinLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coinLogoPreview || coinLogoUrl || ''} alt="Coin Logo" className="w-full h-full object-cover" />
              ) : (
                <CoinLogo size={80} />
              )}
            </div>
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-[hsl(43_30%_25%)] rounded-lg hover:border-[hsl(43_65%_52%)] text-sm">
                <Upload className="h-4 w-4 text-[hsl(43_65%_52%)]" />
                Upload Coin Logo (Circular, Gold Border)
              </div>
              <input type="file" accept=".jpg,.jpeg,.png,image/*" onChange={handleLogoChange} className="hidden" />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">Mandatory — circular with gold border on every header, card, button.</p>
        </div>

        {/* Profile Fields */}
        <div className="black-gold-card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold">Profile Details</h2>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)]"
            />
          </div>

          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[hsl(43_65%_52%)]">Fairy Quote (Gold Italic)</Label>
            <Textarea
              value={fairyQuote}
              onChange={(e) => setFairyQuote(e.target.value)}
              className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)] italic"
            />
            <FairyQuote size="sm" />
          </div>

          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Founder's biography..."
              rows={6}
              className="bg-[hsl(0_0%_8%)] border-[hsl(43_30%_25%)] focus:border-[hsl(43_65%_52%)]"
            />
          </div>
        </div>

        {/* Author Images */}
        <div className="black-gold-card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-[hsl(43_65%_52%)]" />
            Author Images (Optional)
          </h2>

          {/* Image 1 */}
          <div className="space-y-2">
            <Label>Author Image 1 (Optional)</Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-[hsl(0_0%_8%)] flex items-center justify-center border border-[hsl(43_30%_25%)]">
                {img1Preview || img1Url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img1Preview || img1Url || ''} alt="Author Image 1" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-[hsl(43_30%_25%)] rounded-lg hover:border-[hsl(43_65%_52%)] text-sm">
                    <Upload className="h-4 w-4 text-[hsl(43_65%_52%)]" />
                    {img1File ? img1File.name : img1Url ? 'Replace Image 1' : 'Upload Image 1'}
                  </div>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/*"
                    onChange={(e) => handleImageChange(e, setImg1File, setImg1Preview)}
                    className="hidden"
                  />
                </label>
                {(img1Preview || img1Url) && (
                  <button
                    type="button"
                    onClick={() => { setImg1File(null); setImg1Preview(null); setImg1Url(null); }}
                    className="text-muted-foreground hover:text-red-400 p-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Image 2 */}
          <div className="space-y-2">
            <Label>Author Image 2 (Optional)</Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-[hsl(0_0%_8%)] flex items-center justify-center border border-[hsl(43_30%_25%)]">
                {img2Preview || img2Url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img2Preview || img2Url || ''} alt="Author Image 2" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-[hsl(43_30%_25%)] rounded-lg hover:border-[hsl(43_65%_52%)] text-sm">
                    <Upload className="h-4 w-4 text-[hsl(43_65%_52%)]" />
                    {img2File ? img2File.name : img2Url ? 'Replace Image 2' : 'Upload Image 2'}
                  </div>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/*"
                    onChange={(e) => handleImageChange(e, setImg2File, setImg2Preview)}
                    className="hidden"
                  />
                </label>
                {(img2Preview || img2Url) && (
                  <button
                    type="button"
                    onClick={() => { setImg2File(null); setImg2Preview(null); setImg2Url(null); }}
                    className="text-muted-foreground hover:text-red-400 p-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          type="submit"
          disabled={saving}
          className="w-full gold-gradient text-black font-semibold hover:glow-gold h-12"
        >
          {saving ? (
            'Saving...'
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Founder Profile
            </>
          )}
        </Button>

        {saving && (
          <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-400" />
            Saving and syncing to /about...
          </p>
        )}
      </form>
    </div>
  );
}
