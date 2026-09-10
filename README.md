# SHANMUGAVEL BOOKUNIVERSE - For 5% THINKERS

> **Founder:** Shanmugavel M
> **Brand:** Coin Logo Mandatory on Every Screen | Black & Gold Luxury `#D4AF37`
> **Philosophy:** *"World is a fantasy, My books are fairies, let my fairy guide you to explore the fantasy"* - Gold Italic Everywhere

### CORE PRINCIPLE: READ / PLAY ONLY - No Download Ever
- **Ebooks:** PDF.js Protected Viewer | Front Cover JPG = First Page (Minted Not Printed)
- **Audiobooks:** Howler.js Protected Player | Opening + Chapters (Max 15) + Ending
- Sample Before Buy (Free) vs Full After Purchase (Paid)

---

### USER - Public Experience
- `/` - Landing: 2 Grids (Ebooks + Audiobooks) with Gold Coin Logo
- `/ebook/[id]` - PDF.js READ ONLY, no download, no right-click
- `/audiobook/[id]` - Howler.js PLAY ONLY, signed URLs <10min expiry
- `/cart`, `/my-books`, `/about` - Razorpay Checkout

### ADMIN - Founder Vault (Private)
- `/admin` - 3-Step Auth: 
    1. Seal `VELS5PERCENT` 
    2. Email `shanmugavelvetri@gmail.com` / `velshanmugam850` 
    3. OTP 6-digit (Supabase Auth)
- `/admin/mybooks` - Drafts + Existing (Ex: GUN STORY)
- `/admin/ebooks/create` - Title*, Authors+, PDF REQUIRED (doc/mobi/txt auto->PDF), Cover JPG MANDATORY merged as First Page
- `/admin/audiobooks/create` - BIG GOLD BOX: Opening* + Chapters B1-B15 + Ending*, PDF Ref Mandatory (verification only, not shown to user)
- `/admin/dashboard`, `/admin/founder` - Live Stats

---

### Tech Stack
Next.js 15 + Tailwind + Supabase (Auth + DB + Storage) + Cloudflare R2 / Oracle Free + Razorpay + PDF.js + Howler.js

### Deploy to Vercel - BlackBox Method
1. `npm install` (after deleting .bolt & .next folders)
2. Copy `.env.example` to `.env.local` and fill:
      - `NEXT_PUBLIC_SUPABASE_URL`
      - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
      - `SUPABASE_SERVICE_ROLE_KEY`
      - `R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY`
      - `RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET`
3. Run `supabase/schema.sql` in Supabase SQL Editor + Disable RLS for `audio_chapters`
4. Create R2 bucket `bookuniverse-files` + Set CORS
5. `npm run dev` -> http://localhost:3000
6. `vercel --prod`

### Storage Architecture
- **Covers (JPG):** Cloudinary / R2 Public - Fast CDN
- **Audio (MP3):** Supabase Storage `audiobook-files` PRIVATE - Signed URLs only
- **Structure:** `chapters/{audiobook_id}/{timestamp}-{name}.mp3`
- **Limit:** R2 10GB + B2 10GB = 20GB | Oracle Always Free 20GB Alt

### Payment - Razorpay
Test Mode: `success@razorpay` / `failure@razorpay` | Card: `4111 1111 1111 1111`

### Brand Assets - MANDATORY
`/public/logo.png` - Gold Coin with `SHANMUGAVEL M` + Blue Whale - Must be on EVERY screen header/footer

---
Built for 5% Thinkers. Minted Not Printed.