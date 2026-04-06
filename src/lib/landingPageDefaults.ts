// Default landing page content — used as fallback when event.landing_page_data doesn't have a section
// Each event can override any/all of these sections via the admin dashboard

export interface ProblemItem {
  icon: string
  title: string
  desc: string
  glow: 'purple' | 'teal'
}

export interface RoadmapStep {
  num: string
  icon: string
  title: string
  desc: string
  color: string
}

export interface ToolItem {
  name: string
  cost: string
  emoji: string
  desc: string
}

export interface ComparisonRow {
  feature: string
  typical: string
  ours: string
}

export interface BuildItem {
  icon: string
  title: string
  glow: 'purple' | 'teal'
}

export interface FaqItem {
  q: string
  a: string
}

export interface LandingPageContent {
  // Existing fields
  hero_headlines: string[]
  special_offer: string
  software_budget: string
  instructor_name: string
  company_name: string
  company_tagline: string

  // Video
  video_url: string
  video_title: string

  // Blueprint form toggle
  show_blueprint_form: boolean

  // Problem section
  problem_section: {
    label: string
    title: string
    subtitle: string
    items: ProblemItem[]
    bottom_text: string
  }

  // Transformation section
  transformation_section: {
    label: string
    title: string
    before_items: string[]
    after_items: string[]
  }

  // Comparison section
  comparison_section: {
    label: string
    title: string
    subtitle: string
    rows: ComparisonRow[]
  }

  // What you will build
  build_section: {
    label: string
    title: string
    subtitle: string
    items: BuildItem[]
  }

  // Roadmap
  roadmap_section: {
    label: string
    title: string
    steps: RoadmapStep[]
  }

  // Revenue calculator
  show_calculator: boolean
  calculator_section: {
    label: string
    title: string
    subtitle: string
  }

  // Tool stack
  tools_section: {
    label: string
    title: string
    subtitle: string
    required: ToolItem[]
    optional: ToolItem[]
    budget_text: string
  }

  // Audience / who this is for
  audience_section: {
    label: string
    title: string
    for_items: string[]
    not_for_items: string[]
  }

  // FAQ
  faq_items: FaqItem[]

  // Pricing section text
  pricing_section: {
    subtitle: string
    special_offer_title: string
    special_offer_text: string
    checkout_note: string
  }

  // Final CTA
  final_cta: {
    title: string
    subtitle: string
  }

  // Section visibility toggles — each can be independently shown/hidden per event
  sections_enabled: {
    video: boolean
    problem: boolean
    transformation: boolean
    comparison: boolean
    build: boolean
    roadmap: boolean
    calculator: boolean
    tools: boolean
    audience: boolean
    faq: boolean
    pricing: boolean
    final_cta: boolean
  }
}

export const DEFAULT_LANDING_PAGE_CONTENT: LandingPageContent = {
  hero_headlines: [],
  special_offer: '',
  software_budget: '',
  instructor_name: 'Daniel Knight',
  company_name: 'Night Vibe',
  company_tagline: 'AI App Development Company',

  video_url: 'https://www.youtube.com/embed/J3_GSRcB_ac?rel=0',
  video_title: 'Night Vibe Workshop',

  show_blueprint_form: false,

  problem_section: {
    label: 'The problem',
    title: 'You know AI can change your business.',
    subtitle: 'You just have not found the right way in.',
    items: [
      { icon: '🔄', title: 'Drowning in manual work', desc: 'You are doing the same tasks by hand every week. Things that should be automated are eating your hours and killing your margins.', glow: 'purple' },
      { icon: '💸', title: 'Paying for too many tools', desc: 'Your tech stack costs hundreds per month. Half the features go unused. You know you could build something better and cheaper.', glow: 'teal' },
      { icon: '😶', title: 'AI feels overwhelming', desc: 'You see the potential but every course is theory-heavy, developer-focused, or too broad to be useful for your specific business.', glow: 'purple' },
      { icon: '💡', title: 'Ideas that never launch', desc: 'You have had the app idea for months. Maybe years. But hiring a developer costs $10K-$50K and you are not sure it will even work.', glow: 'teal' },
      { icon: '⏫', title: 'Falling behind competitors', desc: 'Every month you wait, someone else in your industry is automating, building, and pulling ahead. The gap is growing.', glow: 'purple' },
      { icon: '🚫', title: 'Do not want to learn code', desc: 'You are a business builder, not a programmer. You need a practical path that works with your skills, not against them.', glow: 'teal' },
    ],
    bottom_text: 'The real cost of waiting is not just money. It is lost time, missed revenue, and falling further behind every single month.',
  },

  transformation_section: {
    label: 'The transformation',
    title: 'Walk in with a problem. Walk out with a working app.',
    before_items: [
      'Stuck with ideas that never move forward',
      'Paying for fragmented SaaS tools',
      'Manual processes eating your time',
      'Confused about where to start with AI',
      'Dependent on expensive developers',
      'No clear path from idea to revenue',
    ],
    after_items: [
      'A working app deployed and live on the web',
      'A clearer offer tied to real business outcomes',
      'Skills to build more apps on your own',
      'A system that saves time or generates revenue',
      'Full ownership of your code and product',
      'Confidence to execute with modern AI tools',
    ],
  },

  comparison_section: {
    label: 'Why this is different',
    title: 'This is not a course. This is a build sprint.',
    subtitle: 'You do not sit and watch. You open your laptop, follow along live, and walk out with something real.',
    rows: [
      { feature: 'Format', typical: 'Pre-recorded videos', ours: 'Live, guided build sessions' },
      { feature: 'Outcome', typical: 'Knowledge (maybe)', ours: 'A deployed, working app' },
      { feature: 'Support', typical: 'Community forum', ours: '20-person live Q&A' },
      { feature: 'Duration', typical: 'Weeks or months', ours: '2 days, 8 hours total' },
      { feature: 'Focus', typical: 'Broad AI theory', ours: 'Your specific business problem' },
      { feature: 'Tools', typical: 'Outdated or generic', ours: 'Claude + Supabase + Vercel (2026 stack)' },
      { feature: 'After the event', typical: 'You are on your own', ours: 'Community + future sessions included' },
    ],
  },

  build_section: {
    label: 'What you will build',
    title: 'Real apps. Real revenue. Real time savings.',
    subtitle: 'You do not need the perfect idea before joining. The workshop helps you identify the right use case.',
    items: [
      { icon: '🛠', title: 'Internal Tools', glow: 'purple' },
      { icon: '👥', title: 'Customer Portals', glow: 'teal' },
      { icon: '🎯', title: 'Lead Gen Tools', glow: 'purple' },
      { icon: '⚡', title: 'Automation', glow: 'teal' },
      { icon: '💰', title: 'Micro-SaaS', glow: 'purple' },
    ],
  },

  roadmap_section: {
    label: 'Your journey',
    title: 'From idea to live app in 4 steps',
    steps: [
      { num: '01', icon: '📝', title: 'Register & Prep', desc: 'Secure your seat, set up your free accounts, and arrive with your business problem ready to solve.', color: '#8B5CF6' },
      { num: '02', icon: '💡', title: 'Define Your App', desc: 'Use our 3-Step AI Blueprint to turn your idea into a clear architecture. No code needed.', color: '#6366F1' },
      { num: '03', icon: '🔨', title: 'Build It Live', desc: 'Follow along step-by-step as you use Claude, Supabase, and Vercel to build your real app.', color: '#2DD4BF' },
      { num: '04', icon: '🎉', title: 'Deploy & Launch', desc: 'Push your app live. It works. People can use it. You own the code forever.', color: '#22D3EE' },
    ],
  },

  show_calculator: true,
  calculator_section: {
    label: 'Revenue potential',
    title: 'See what your app could generate',
    subtitle: 'Adjust the numbers to match your market. Even a small app can pay for this workshop many times over.',
  },

  tools_section: {
    label: 'The tool stack',
    title: 'Modern tools. Minimal cost. Maximum power.',
    subtitle: 'Everything is beginner-friendly and guided live during the workshop. Some tools are optional — the essentials are free or under $20/mo.',
    required: [
      { name: 'Claude', cost: '$20/mo', emoji: '🤖', desc: 'Your AI building partner' },
      { name: 'Supabase', cost: 'Free', emoji: '⚡', desc: 'Database & auth' },
      { name: 'Vercel', cost: 'Free', emoji: '▲', desc: 'Hosting & deploy' },
    ],
    optional: [
      { name: 'Emergent Labs', cost: '$20/mo', emoji: '🔬', desc: 'AI dev tools' },
      { name: 'Gemini', cost: 'Free', emoji: '⭐', desc: 'Supporting AI' },
      { name: 'Gamma', cost: 'Free', emoji: '🎨', desc: 'Presentations' },
    ],
    budget_text: 'Total budget: about $20-$50/month. Most tools are free. We walk through every setup step live.',
  },

  audience_section: {
    label: 'Is this right for you',
    title: 'This workshop is built for a specific kind of person',
    for_items: [
      'You already have a business, have a business idea, or want to see how you can turn your app idea into a business',
      'You want to replace software tools or build a new revenue stream',
      'You are ready to execute live, not just watch',
      'You want a working app, not more theory',
      'You are comfortable using AI tools and following guidance',
      'You want to move fast and build something real this month',
    ],
    not_for_items: [
      'You just want to learn about AI without building anything',
      'You are looking for a passive video course',
      'You are not willing to show up live for both days',
      'You do not have a business problem or idea to work on',
      'You expect someone else to build your app for you',
      'You are looking for the cheapest option, not the best outcome',
    ],
  },

  faq_items: [
    { q: 'Do I need to know how to code?', a: 'No. This workshop is designed for business owners and non-developers. You will use AI tools to build your app with guided, step-by-step instructions.' },
    { q: 'What kind of app can I build?', a: 'Internal tools, customer-facing products, lead generation tools, workflow automation, or even a paid micro-SaaS. The workshop helps you identify the right use case.' },
    { q: 'What if I do not have my idea yet?', a: 'That is completely fine. The workshop includes a framework for identifying the best app opportunity for your business.' },
    { q: 'Will I really finish with something functional?', a: 'Yes. You build and deploy a working app by the end of Day 2. It will be live on the internet, functional, and yours to keep.' },
    { q: 'What tools do I need?', a: 'A computer with internet access. Claude ($20/mo), Supabase (free), Vercel (free). Optional: Emergent Labs ($20/mo), Gemini (free). Total: $20-$50/month.' },
    { q: 'Is the recording included?', a: 'Yes. Full recordings of both days are included. Rewatch any section anytime.' },
    { q: 'What if the workshop sells out?', a: 'Join the waitlist. All future sessions are included with your purchase when you do register.' },
    { q: 'Can I bring my team?', a: 'Yes. Bring 3 employees or 3 friends and your seat is free. Each person needs their own device.' },
    { q: 'What timezone is this in?', a: '9:00 AM to 1:00 PM Pacific (12:00 PM to 4:00 PM Eastern).' },
    { q: 'What is the Launch Accelerator Tool?', a: 'A bonus AI-powered tool exclusively for attendees. It guides you through the most thorough and effective app launch process — your personal launch checklist on steroids.' },
  ],

  sections_enabled: {
    video: true,
    problem: true,
    transformation: true,
    comparison: true,
    build: true,
    roadmap: true,
    calculator: true,
    tools: true,
    audience: true,
    faq: true,
    pricing: true,
    final_cta: true,
  },

  pricing_section: {
    subtitle: 'One-time investment. Lifetime access to recordings and community.',
    special_offer_title: 'Special Offer',
    special_offer_text: 'Bring 3 employees or 3 friends and your session is free.',
    checkout_note: 'Secure checkout via Stripe. Instant confirmation. Calendar invite sent within minutes.',
  },

  final_cta: {
    title: 'Two days from now, you could have a working app.',
    subtitle: 'Secure checkout. Instant access. Recording included.',
  },
}

// Helper to merge event's landing_page_data with defaults
export function getLandingContent(eventData?: Partial<LandingPageContent>): LandingPageContent {
  if (!eventData) return DEFAULT_LANDING_PAGE_CONTENT

  const merged = { ...DEFAULT_LANDING_PAGE_CONTENT }

  // Shallow merge top-level primitives and arrays
  for (const key of Object.keys(DEFAULT_LANDING_PAGE_CONTENT) as (keyof LandingPageContent)[]) {
    const val = eventData[key]
    if (val !== undefined && val !== null && val !== '') {
      if (typeof val === 'object' && !Array.isArray(val)) {
        // Deep merge objects one level
        (merged as any)[key] = { ...(DEFAULT_LANDING_PAGE_CONTENT as any)[key], ...(val as any) }
      } else {
        (merged as any)[key] = val
      }
    }
  }

  return merged
}
