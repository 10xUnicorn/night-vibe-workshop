'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface EventData {
  title: string
  slug: string
  start_date: string
}

// ─────────────────────────────────────────────
// PROMPTS — All copy-able build prompts
// ─────────────────────────────────────────────
const DAY1_PROMPTS = [
  {
    id: 'starter-build',
    label: 'Starter Build Prompt',
    tag: 'DAY 1 · HOUR 2',
    color: '#6C3AED',
    prompt: `You are building a web app for me. Here is my app idea:

App Name: [YOUR APP NAME]
What it does: [ONE SENTENCE DESCRIPTION]
Who it's for: [YOUR TARGET USER]
Core problem it solves: [THE PROBLEM]
Main feature: [THE #1 THING USERS DO IN YOUR APP]

Build me a complete, multi-page web app with:
- A clean, modern dark UI (dark background, purple/teal accents)
- A home/landing page that explains what the app does
- A main app page where the core feature lives
- A navigation bar with links between pages
- Mobile responsive design
- Placeholder data to show how it will look

Use HTML, CSS, and JavaScript in a single file or organized multi-file structure. Make it look professional and real, not like a template.`,
  },
  {
    id: 'ui-refinement',
    label: 'UI Refinement Prompt',
    tag: 'DAY 1 · HOUR 2',
    color: '#6C3AED',
    prompt: `Review the current UI of my app and make these improvements:

1. Make it look more polished and professional
2. Improve spacing and typography — use a clean sans-serif font
3. Add subtle hover effects on buttons and interactive elements
4. Make sure colors are consistent throughout
5. Add visual hierarchy — most important things should stand out
6. Remove anything that looks like a template or placeholder except actual content areas

Keep the same overall layout and functionality — just make it look significantly better.`,
  },
  {
    id: 'mobile-responsive',
    label: 'Mobile Responsiveness Prompt',
    tag: 'DAY 1 · HOUR 2',
    color: '#6C3AED',
    prompt: `Make my app fully mobile responsive:

1. Navigation: collapse into a hamburger menu on mobile (under 768px)
2. All grid/flex layouts: stack vertically on mobile
3. Font sizes: slightly smaller on mobile
4. Buttons: full width on mobile, comfortable tap target size (min 44px height)
5. Images: scale down properly, no overflow
6. Forms: full width inputs on mobile
7. Test at 375px (iPhone SE), 390px (iPhone 14), and 414px widths

Do not change desktop layout — only add responsive breakpoints.`,
  },
  {
    id: 'supabase-connect',
    label: 'Connect Supabase Database',
    tag: 'DAY 1 · HOUR 3',
    color: '#2DD4BF',
    prompt: `Connect my app to Supabase. Here are my credentials:

Supabase Project URL: [YOUR_SUPABASE_URL]
Supabase Anon Key: [YOUR_SUPABASE_ANON_KEY]

Create a table called [TABLE_NAME] with these columns:
- id (uuid, primary key, default: gen_random_uuid())
- created_at (timestamp with time zone, default: now())
- [COLUMN_NAME] (text)
- [COLUMN_NAME_2] (text)

Then connect my form so that when the user submits it:
1. The data saves to the Supabase table
2. Show a success message after submission
3. Clear the form after submission
4. Handle errors gracefully with a user-friendly error message

Add the Supabase JS client (@supabase/supabase-js) and wire up the insert.`,
  },
  {
    id: 'stripe-payment',
    label: 'Add Stripe Payment Button',
    tag: 'DAY 1 · HOUR 3',
    color: '#2DD4BF',
    prompt: `Add a Stripe payment button to my app.

My Stripe payment link: [YOUR_STRIPE_PAYMENT_LINK]

Add a prominent "Get Access" / "Buy Now" / "[YOUR CTA]" button that:
1. Opens the Stripe payment link in a new tab when clicked
2. Looks like a premium CTA button (not a plain link)
3. Shows the price clearly: $[YOUR_PRICE]
4. Has a brief value statement above it: "[WHAT THEY GET]"

Place it in [WHERE IN THE APP — e.g., "the hero section" or "the pricing section"].

Style it to match my app's existing color scheme.`,
  },
  {
    id: 'deploy-env',
    label: 'Prepare for Vercel Deployment',
    tag: 'DAY 1 · HOUR 4',
    color: '#F5C542',
    prompt: `Prepare my app for deployment to Vercel:

1. Move all API keys and secrets to environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - Any other keys currently hardcoded

2. Create a .env.local file with placeholder values showing what's needed
3. Create a .env.example file (safe to commit) with blank values
4. Make sure .gitignore includes .env.local
5. Update any hardcoded URLs to use environment variables or relative paths

List all environment variables I need to add in Vercel after deployment.`,
  },
]

const DAY2_PROMPTS = [
  {
    id: 'ux-audit',
    label: 'First-Time User UX Audit',
    tag: 'DAY 2 · HOUR 1',
    color: '#6C3AED',
    prompt: `Review my app as if you are a first-time user who has never seen it before. You have no context about what it does — you only see what's on screen.

Identify the top 5 UX problems:
1. What is confusing or unclear?
2. What is missing that a user would expect?
3. What feels broken, slow, or frustrating?
4. Where would a user drop off or give up?
5. What copy is unclear, generic, or unhelpful?

For each problem, provide:
- The specific issue
- Why it matters
- The exact fix you recommend

Then implement all 5 fixes.`,
  },
  {
    id: 'debug-prompt',
    label: 'Structured Debug Prompt',
    tag: 'DAY 2 · HOUR 1',
    color: '#6C3AED',
    prompt: `I have a bug in my app. Here is the exact context:

What I am trying to do: [DESCRIBE THE FEATURE]
What happens instead: [DESCRIBE THE BUG — exact error or behavior]
Expected behavior: [WHAT SHOULD HAPPEN]
When it happens: [STEPS TO REPRODUCE — click X, then Y, then Z]

Relevant code (paste it here):
[PASTE THE RELEVANT CODE SECTION]

Console error (if any):
[PASTE ERROR MESSAGE]

Please:
1. Identify the root cause
2. Explain why it's happening in plain English
3. Fix it
4. Verify the fix doesn't break anything else nearby`,
  },
  {
    id: 'logo-prompt',
    label: 'Logo Generation Prompt (Gemini)',
    tag: 'DAY 2 · HOUR 2',
    color: '#2DD4BF',
    prompt: `Generate a professional app logo for [APP NAME].

Requirements:
- Icon only — no text, no words, no letters
- Flat design style
- Primary color: [YOUR HEX COLOR, e.g. #6C3AED]
- Transparent background
- Represents: [ONE WORD OR CONCEPT YOUR APP IS ABOUT]
- Clean, minimal, modern
- Would work as an app icon at small sizes

Generate 4 variations. I will choose the best one.

Also generate:
1. A horizontal logo version with the app name "[APP NAME]" in clean bold sans-serif next to the icon
2. A square version for social media profile picture (icon centered with slight padding)`,
  },
  {
    id: 'social-share',
    label: 'Social Share Image Prompt (Gemini)',
    tag: 'DAY 2 · HOUR 2',
    color: '#2DD4BF',
    prompt: `Create a social share image (Open Graph image) for my app.

Dimensions: 1200 x 630 pixels
App name: [APP NAME]
Tagline: [ONE LINE THAT SAYS WHAT IT DOES]
Style: Dark background, modern, professional

Include:
- App name in large bold text
- Tagline below
- App icon/logo in the upper right or left
- Subtle gradient or pattern background
- A small URL or brand mark at the bottom: [YOUR URL]

This image will appear when someone shares my app link on Twitter, LinkedIn, or iMessage.`,
  },
  {
    id: 'oneliner',
    label: 'App One-Liner Generator',
    tag: 'DAY 2 · HOUR 3',
    color: '#F5C542',
    prompt: `Write 10 different one-liner descriptions for my app.

App: [APP NAME]
What it does: [DESCRIPTION]
Who it's for: [TARGET USER]
Core benefit: [THE #1 THING IT DOES FOR THEM]

Each one-liner should be:
- Under 15 words
- Outcome-focused (what the user GETS, not what the app IS)
- Clear to someone who has never heard of it
- Different angle each time (time savings, money, status, clarity, etc.)

Then tell me which 3 are strongest and why.`,
  },
  {
    id: 'launch-post',
    label: 'Launch Announcement Post',
    tag: 'DAY 2 · HOUR 3',
    color: '#F5C542',
    prompt: `Write a launch announcement post for my app for Instagram and LinkedIn.

App: [APP NAME]
What it does: [DESCRIPTION]
Who it helps: [TARGET USER]
Price or access: [FREE / $PRICE / WAITLIST]
Link: [YOUR URL]

For Instagram:
- Hook first line (scroll-stopper)
- 3-5 sentences about the problem and solution
- Call to action: link in bio
- 10 relevant hashtags

For LinkedIn:
- Professional tone, story-driven
- Start with a personal insight or observation
- Build to the app reveal
- End with clear CTA and link
- No hashtag spam — 3-5 max

Make both feel authentic, not like a product ad.`,
  },
]

const SKILLS = [
  {
    name: 'Vercel Deploy',
    description: 'Opens the terminal to the correct folder and gives you each deploy command one at a time — never all at once.',
    prompt: `Create a skill so anytime we are deploying to Vercel, use the terminal and open the correct folder to push the command, then give me each command that needs to be sent to the terminal one at a time, separately if they need to be done separately.`,
  },
  {
    name: 'Project Selector',
    description: 'Always asks before overwriting anything or creating a new project — confirms your Vercel, Supabase, and GitHub.',
    prompt: `Create a skill to Always ask before overwriting anything or creating a new project to verify which Vercel, Supabase, and GitHub project or repository we are working in.`,
  },
  {
    name: 'Safety Guard',
    description: 'Asks before deleting or overwriting any file. Moves to trash instead of permanently deleting.',
    prompt: `Create a skill to make sure that if you're ever changing files on the computer, you ask me before deleting or overwriting anything that might actually be needed. Ideally, don't just delete things; move them to the trash or recycle bin instead.`,
  },
  {
    name: 'Prompt Optimizer',
    description: 'Checks which plugin or connector is best for your prompt, then reviews and clarifies it before running.',
    prompt: `Create a skill that checks which plugin or connector is best for the prompt that was given every time the prompt is submitted. Always make sure to review the prompt to see how it can be structured more clearly and ask clarifying questions if you have any to ensure we get the best output.`,
  },
  {
    name: 'Session Tracker',
    description: 'Before compacting, saves a full markdown record of the session — so you never lose context or progress.',
    prompt: `Create a skill to make sure that before compacting a session you take a second to review what has been created and structure things so we do not lose information, Always. Create a markdown file that we can download and that you store and reference and update at all times of each session before compacting the conversation so we can keep a record of all the information provided as well as provide the document to a new session to tell you exactly where we left off, what's next, what's been done, where everything is at, all the keys and details of what's being built, etc. Always use skills to pull from the database we will have to maximize usage.`,
  },
]

const TOOLS = [
  { name: 'AppDash.me', url: 'https://appdash.me', description: 'Define your app, generate your build prompt', tag: 'App Builder' },
  { name: 'Claude Cowork', url: 'https://claude.ai', description: 'AI coding partner — your main build tool', tag: 'AI Builder' },
  { name: 'Supabase', url: 'https://supabase.com', description: 'Free database, auth, and backend', tag: 'Database' },
  { name: 'Stripe', url: 'https://stripe.com', description: 'Accept payments (free, processing fees only)', tag: 'Payments' },
  { name: 'Vercel', url: 'https://vercel.com', description: 'Deploy and host your app for free', tag: 'Hosting' },
  { name: 'GitHub', url: 'https://github.com', description: 'Store your code and push to production', tag: 'Code Storage' },
  { name: 'Gemini', url: 'https://gemini.google.com', description: 'Generate logos, graphics, and promo content', tag: 'Design AI' },
  { name: 'Gamma.app', url: 'https://gamma.app', description: 'Build pitch decks and one-pagers in minutes', tag: 'Pitch Deck' },
  { name: 'CopyLaunch.app', url: 'https://copylaunch.app', description: 'AI marketing campaigns and launch copy', tag: 'Marketing' },
  { name: 'Wispr Flow', url: 'https://wisprflow.ai/r?DANIEL94128', description: 'Dictate anything — AI turns your voice into polished text across any app', tag: 'Productivity' },
]

const POST_EVENT = [
  { label: 'Share your app in the community', url: 'https://www.skool.com/unicornuniverse', cta: 'Post in Unicorn Universe →' },
  { label: 'Leave a workshop testimonial', url: 'http://workshop.nightvibe.me/workshop-review', cta: 'Submit Testimonial →' },
  { label: 'Refer someone / become an affiliate', url: 'https://workshop.nightvibe.me/partners', cta: 'Join Partner Program →' },
  { label: 'Send us feedback', url: 'mailto:team@knightops.biz', cta: 'Email the Team →' },
]

// ─────────────────────────────────────────────
// COPY BUTTON COMPONENT
// ─────────────────────────────────────────────
function CopyButton({ text, label = 'Copy Prompt' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '8px 18px',
        background: copied ? 'rgba(45,212,191,0.15)' : 'rgba(108,58,237,0.15)',
        border: `1px solid ${copied ? '#2DD4BF' : 'rgba(108,58,237,0.4)'}`,
        borderRadius: 8,
        color: copied ? '#2DD4BF' : '#a78bfa',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {copied ? '✓ Copied!' : label}
    </button>
  )
}

// ─────────────────────────────────────────────
// PROMPT CARD
// ─────────────────────────────────────────────
function PromptCard({ p }: { p: (typeof DAY1_PROMPTS)[0] }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(v => !v)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <span
            style={{
              padding: '3px 10px',
              background: `${p.color}22`,
              border: `1px solid ${p.color}44`,
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              color: p.color,
              whiteSpace: 'nowrap',
              letterSpacing: 0.5,
            }}
          >
            {p.tag}
          </span>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#f0f0f5' }}>{p.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <CopyButton text={p.prompt} />
          <span style={{ color: '#6b7280', fontSize: 18, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            ▾
          </span>
        </div>
      </div>

      {/* Expanded prompt */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0 20px 20px' }}>
          <pre
            style={{
              marginTop: 16,
              padding: 16,
              background: '#0a0a12',
              borderRadius: 10,
              fontSize: 13,
              lineHeight: 1.7,
              color: '#cbd5e1',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {p.prompt}
          </pre>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function ResourcesPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [event, setEvent] = useState<EventData | null>(null)
  const [activeSection, setActiveSection] = useState<'day1' | 'day2' | 'tools' | 'skills' | 'postEvent'>('day1')

  useEffect(() => {
    if (!slug) return
    sb.from('events').select('title, slug, start_date').eq('slug', slug).single().then(({ data }) => {
      if (data) setEvent(data as EventData)
    })
  }, [slug])

  const sections: { id: typeof activeSection; label: string; emoji: string }[] = [
    { id: 'day1', label: 'Day 1 Prompts', emoji: '⚡' },
    { id: 'day2', label: 'Day 2 Prompts', emoji: '🚀' },
    { id: 'tools', label: 'Tools & Links', emoji: '🛠️' },
    { id: 'skills', label: 'Claude Skills', emoji: '🧠' },
    { id: 'postEvent', label: 'Post-Event', emoji: '🌟' },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0d0a1a',
        color: '#f0f0f5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(13,10,26,0.95)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6C3AED, #2DD4BF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1 }}>
              {event?.title || 'Workshop Resources'}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#f0f0f5', lineHeight: 1.3 }}>Build & Launch Resources</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <a
              href={`/events/${slug}`}
              style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none' }}
            >
              ← Event Page
            </a>
          </div>
        </div>

        {/* Nav tabs */}
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            gap: 4,
            overflowX: 'auto',
            paddingBottom: 1,
          }}
        >
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${activeSection === s.id ? '#6C3AED' : 'transparent'}`,
                color: activeSection === s.id ? '#a78bfa' : '#6b7280',
                fontSize: 13,
                fontWeight: activeSection === s.id ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* ── DAY 1 PROMPTS ── */}
        {activeSection === 'day1' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: '#f0f0f5' }}>⚡ Day 1 Build Prompts</h2>
              <p style={{ margin: 0, fontSize: 15, color: '#9ca3af', lineHeight: 1.6 }}>
                Click any prompt to expand it, edit the <span style={{ color: '#6C3AED', fontFamily: 'monospace' }}>[BRACKETS]</span> with your details, then copy and paste into Claude Cowork.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {DAY1_PROMPTS.map(p => (
                <PromptCard key={p.id} p={p} />
              ))}
            </div>

            {/* Share Progress */}
            <div style={{ marginTop: 28, padding: '24px', background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.25)', borderRadius: 16 }}>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#2DD4BF' }}>📣 Share Your Day 1 Progress</p>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>Copy this template, fill in the blanks, and post in the community:</p>
              <CopyButton
                label="Copy Post Template"
                text={`🚀 Day 1 of the Night Vibe AI App Workshop — here's what I built:

App Name: [YOUR APP NAME]
What it does: [ONE SENTENCE]
Built with: Claude Cowork + Supabase + Vercel

The hardest part was: [SOMETHING YOU STRUGGLED WITH]
The coolest thing: [YOUR FAVORITE FEATURE]

Still building. More coming Day 2. 👀

#NightVibeWorkshop #AIAppBuilder #BuildInPublic`}
              />
              <div style={{ marginTop: 14 }}>
                <a
                  href="https://www.skool.com/unicornuniverse/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '10px 22px',
                    background: 'linear-gradient(135deg, #2DD4BF, #6C3AED)',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  Post in Unicorn Universe →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── DAY 2 PROMPTS ── */}
        {activeSection === 'day2' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: '#f0f0f5' }}>🚀 Day 2 Build Prompts</h2>
              <p style={{ margin: 0, fontSize: 15, color: '#9ca3af', lineHeight: 1.6 }}>
                Polish, brand, market, and launch. Edit the <span style={{ color: '#2DD4BF', fontFamily: 'monospace' }}>[BRACKETS]</span> with your details, copy, and go.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {DAY2_PROMPTS.map(p => (
                <PromptCard key={p.id} p={p} />
              ))}
            </div>

            {/* Share Progress */}
            <div style={{ marginTop: 28, padding: '24px', background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.25)', borderRadius: 16 }}>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#2DD4BF' }}>📣 Share Your Day 2 Progress</p>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>Copy this template, fill in the blanks, and post in the community:</p>
              <CopyButton
                label="Copy Post Template"
                text={`✅ I just launched my app at the Night Vibe AI Workshop. Here's the recap:

App: [YOUR APP NAME]
Live at: [YOUR URL]
What it does: [ONE SENTENCE]

Built in 2 days with: Claude Cowork + Supabase + Vercel

What I learned: [YOUR BIGGEST TAKEAWAY]
What I'm adding next: [NEXT FEATURE OR GOAL]

If you want to build your own app — the next workshop is coming. 🔥

#NightVibeWorkshop #AppLaunch #BuiltWithAI #BuildInPublic`}
              />
              <div style={{ marginTop: 14 }}>
                <a
                  href="https://www.skool.com/unicornuniverse/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '10px 22px',
                    background: 'linear-gradient(135deg, #2DD4BF, #6C3AED)',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  Post in Unicorn Universe →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── TOOLS ── */}
        {activeSection === 'tools' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: '#f0f0f5' }}>🛠️ Your Free Tool Stack</h2>
              <p style={{ margin: 0, fontSize: 15, color: '#9ca3af' }}>
                Every tool you need. All free. Open each one and create your account before we start.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {TOOLS.map(t => (
                <a
                  key={t.name}
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    padding: '20px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14,
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                  onMouseEnter={e => {
                    ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(108,58,237,0.5)'
                    ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(108,58,237,0.05)'
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.08)'
                    ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f5' }}>{t.name}</span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        background: 'rgba(108,58,237,0.2)',
                        border: '1px solid rgba(108,58,237,0.3)',
                        borderRadius: 6,
                        color: '#a78bfa',
                        fontWeight: 600,
                      }}
                    >
                      {t.tag}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>{t.description}</p>
                  <p style={{ margin: '10px 0 0', fontSize: 12, color: '#6C3AED' }}>{t.url.replace('https://', '')} →</p>
                </a>
              ))}
            </div>

            {/* App Questionnaire CTA */}
            <div
              style={{
                marginTop: 28,
                padding: '24px',
                background: 'linear-gradient(135deg, rgba(108,58,237,0.12), rgba(45,212,191,0.08))',
                border: '1px solid rgba(108,58,237,0.3)',
                borderRadius: 16,
                textAlign: 'center',
              }}
            >
              <p style={{ margin: '0 0 8px', fontSize: 14, color: '#9ca3af' }}>Before we start building — define your app idea here:</p>
              <a
                href="/app-questionnaire"
                style={{
                  display: 'inline-block',
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, #6C3AED, #a78bfa)',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                Complete App Questionnaire →
              </a>
              <p style={{ margin: '10px 0 0', fontSize: 12, color: '#6b7280' }}>
                Your answers pre-load your app idea in AppDash and get saved for the workshop.
              </p>
            </div>
          </div>
        )}

        {/* ── SKILLS ── */}
        {activeSection === 'skills' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: '#f0f0f5' }}>🧠 Install These Claude Skills</h2>
              <p style={{ margin: 0, fontSize: 15, color: '#9ca3af', lineHeight: 1.6 }}>
                Skills make Claude smarter for your workflow. Install these before Day 1 starts.
              </p>
            </div>

            {/* How to install */}
            <div
              style={{
                padding: '18px 20px',
                background: 'rgba(45,212,191,0.05)',
                border: '1px solid rgba(45,212,191,0.2)',
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <p style={{ margin: 0, fontSize: 14, color: '#2DD4BF', fontWeight: 600 }}>📍 How to Install</p>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: '#9ca3af', lineHeight: 1.6 }}>
                Open Claude → click Settings (gear icon) → Skills → search the skill name → Install
              </p>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {SKILLS.map((s, i) => (
                <div
                  key={s.name}
                  style={{
                    padding: '20px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #6C3AED33, #2DD4BF22)',
                      border: '1px solid rgba(108,58,237,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      flexShrink: 0,
                      fontWeight: 700,
                      color: '#a78bfa',
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f0f0f5' }}>{s.name}</p>
                      <CopyButton text={s.prompt} label="Copy Install Prompt" />
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>{s.description}</p>
                    <div style={{ padding: '10px 12px', background: '#0a0a12', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12, color: '#94a3b8', lineHeight: 1.6, fontFamily: 'ui-monospace, monospace' }}>
                      {s.prompt}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* How to install note */}
            <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(245,197,66,0.06)', border: '1px solid rgba(245,197,66,0.2)', borderRadius: 12 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#F5C542', fontWeight: 600, marginBottom: 4 }}>⚡ How to install each skill</p>
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>
                Start a new chat in Claude Cowork → copy the prompt above → paste it in and hit enter. Claude will create and install the skill automatically.
              </p>
            </div>
          </div>
        )}

        {/* ── POST EVENT ── */}
        {activeSection === 'postEvent' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: '#f0f0f5' }}>🌟 After The Workshop</h2>
              <p style={{ margin: 0, fontSize: 15, color: '#9ca3af', lineHeight: 1.6 }}>
                You built something real. Here's where to go next.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 14, marginBottom: 40 }}>
              {POST_EVENT.map(item => (
                <a
                  key={item.url}
                  href={item.url}
                  target={item.url.startsWith('mailto') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 22px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14,
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'border-color 0.2s',
                    gap: 12,
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(108,58,237,0.4)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.08)')}
                >
                  <span style={{ fontSize: 15, color: '#d1d5db', fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: 14, color: '#6C3AED', fontWeight: 600, whiteSpace: 'nowrap' }}>{item.cta}</span>
                </a>
              ))}
            </div>

            {/* Slides */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#f0f0f5' }}>📊 Workshop Slides</h3>
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 }}>
                <iframe
                  src="https://gamma.app/embed/smkbzpysmaskumb"
                  style={{ width: '100%', maxWidth: '100%', height: 450, border: 'none', display: 'block' }}
                  allow="fullscreen"
                  title="Build & Launch Your App LIVE"
                />
              </div>
              <a
                href="https://assets.api.gamma.app/export/pdf/smkbzpysmaskumb/e8e5d5a070a825b20580e8fb2c86c019/Build-and-Launch-Your-App-LIVE.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '10px 22px',
                  background: 'rgba(108,58,237,0.15)',
                  border: '1px solid rgba(108,58,237,0.4)',
                  color: '#a78bfa',
                  textDecoration: 'none',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                ⬇ Download Slides (PDF)
              </a>
            </div>

            {/* Unicorn Universe Skool CTA */}
            <div
              style={{
                marginBottom: 32,
                padding: '24px',
                background: 'linear-gradient(135deg, rgba(108,58,237,0.12), rgba(45,212,191,0.08))',
                border: '1px solid rgba(108,58,237,0.3)',
                borderRadius: 16,
                textAlign: 'center',
              }}
            >
              <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#f0f0f5' }}>Join the Unicorn Universe Community</p>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: '#9ca3af' }}>Share your app, get feedback, find collaborators, and keep the momentum going.</p>
              <a
                href="https://www.skool.com/unicornuniverse/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, #6C3AED, #2DD4BF)',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                Join Unicorn Universe on Skool →
              </a>
            </div>

            {/* Upgrade paths */}
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#f0f0f5' }}>Go Deeper — Keep Building</h3>
            <div style={{ display: 'grid', gap: 14 }}>
              {[
                {
                  name: 'Unicorn Universe Premium',
                  price: '$99/mo or $997/yr',
                  description: 'Weekly connection & opportunity calls, community platform, connector tools, affiliate systems, Golden Connection events, 25% off UU tools.',
                  color: '#6C3AED',
                  url: 'https://unicornuniverse.io/premium',
                },
                {
                  name: '10xUnicorn Mastermind',
                  price: '$997/mo (founding) · $10k/yr',
                  description: '2x/month mastermind calls, 10x systems & partnerships, high-caliber relationships, execution coaching, AI Marketing Machine included.',
                  color: '#2DD4BF',
                  url: 'https://10xunicorn.win/strategy',
                },
                {
                  name: '1:1 Consulting Package',
                  price: '$25k · 1hr/wk for 90 days + 1yr mastermind',
                  description: 'Full personalized build strategy, direct access to Daniel, scope docs, systems, and introductions to the right people.',
                  color: '#F5C542',
                  url: 'https://10xunicorn.win/strategy',
                },
              ].map(offer => (
                <a
                  key={offer.name}
                  href={offer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    padding: '22px',
                    background: `${offer.color}0d`,
                    border: `1px solid ${offer.color}33`,
                    borderRadius: 14,
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = `${offer.color}77`)}
                  onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = `${offer.color}33`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f5' }}>{offer.name}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: offer.color }}>{offer.price}</span>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>{offer.description}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '24px 20px',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: '#4b5563' }}>
          Night Vibe Workshop · <a href="https://workshop.nightvibe.me" style={{ color: '#6C3AED', textDecoration: 'none' }}>workshop.nightvibe.me</a> · <a href="mailto:team@knightops.biz" style={{ color: '#6C3AED', textDecoration: 'none' }}>team@knightops.biz</a>
        </p>
      </div>
    </div>
  )
}
