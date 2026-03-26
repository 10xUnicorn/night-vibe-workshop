// Night Vibe branded email templates
// All emails use dark theme matching the website

const baseStyles = `
  body { margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .email-wrapper { max-width: 600px; margin: 0 auto; padding: 20px; }
  .email-card { background: #13131a; border: 1px solid rgba(108,58,237,0.25); border-radius: 16px; overflow: hidden; }
  .email-header { background: linear-gradient(135deg, rgba(108,58,237,0.15), rgba(45,212,191,0.08)); padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid rgba(108,58,237,0.15); }
  .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
  .logo-night { color: #a78bfa; }
  .logo-vibe { color: #2dd4bf; }
  .email-body { padding: 32px; }
  .email-footer { padding: 24px 32px; border-top: 1px solid rgba(108,58,237,0.1); text-align: center; }
  h1 { color: #ffffff; font-size: 28px; font-weight: 800; margin: 0 0 8px; line-height: 1.2; }
  h2 { color: #ffffff; font-size: 20px; font-weight: 700; margin: 24px 0 12px; }
  h3 { color: #a78bfa; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px; }
  p { color: #9ca3af; font-size: 15px; line-height: 1.65; margin: 0 0 16px; }
  .accent { color: #a78bfa; }
  .teal { color: #2dd4bf; }
  .success { color: #10b981; }
  .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6c3aed, #a78bfa); color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; text-align: center; }
  .btn-secondary { display: inline-block; padding: 12px 28px; background: transparent; color: #a78bfa !important; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px; border: 2px solid rgba(108,58,237,0.4); }
  .detail-row { display: flex; padding: 12px 0; border-bottom: 1px solid rgba(108,58,237,0.08); }
  .detail-label { color: #6b7280; font-size: 13px; min-width: 120px; }
  .detail-value { color: #ffffff; font-size: 14px; font-weight: 600; }
  .info-card { background: rgba(108,58,237,0.06); border: 1px solid rgba(108,58,237,0.15); border-radius: 12px; padding: 20px; margin: 20px 0; }
  .cta-card { background: linear-gradient(135deg, rgba(108,58,237,0.12), rgba(45,212,191,0.06)); border: 1px solid rgba(108,58,237,0.2); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
  .checklist-item { padding: 8px 0; color: #d1d5db; font-size: 14px; }
  .check { color: #10b981; margin-right: 8px; }
  .promo-bar { background: rgba(45,212,191,0.08); border: 1px solid rgba(45,212,191,0.2); border-radius: 10px; padding: 16px; margin: 24px 0; text-align: center; }
`

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${baseStyles}</style></head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#13131a;border:1px solid rgba(108,58,237,0.25);border-radius:16px;overflow:hidden;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,rgba(108,58,237,0.15),rgba(45,212,191,0.08));padding:32px 32px 24px;text-align:center;border-bottom:1px solid rgba(108,58,237,0.15);">
      <div style="font-size:24px;font-weight:800;letter-spacing:-0.5px;">
        <span style="color:#a78bfa;">Night</span> <span style="color:#2dd4bf;">Vibe</span>
      </div>
      <p style="color:#6b7280;font-size:12px;margin:8px 0 0;letter-spacing:1px;text-transform:uppercase;">AI App Development</p>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="padding:24px 32px;border-top:1px solid rgba(108,58,237,0.1);text-align:center;">
      <p style="color:#4b5563;font-size:12px;margin:0 0 8px;">Night Vibe AI &middot; Build apps that generate revenue</p>
      <p style="color:#374151;font-size:11px;margin:0;">You received this email because you interacted with Night Vibe. <a href="#" style="color:#6b7280;">Unsubscribe</a></p>
    </div>
  </div>
</div>
</body>
</html>`
}

function formatEventDate(startDate: string, endDate: string, timezone: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: timezone }
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', timeZone: timezone }
  const tzNames: Record<string, string> = {
    'America/Los_Angeles': 'Pacific', 'America/New_York': 'Eastern',
    'America/Chicago': 'Central', 'America/Denver': 'Mountain',
  }
  const tzLabel = tzNames[timezone] || timezone
  return `${start.toLocaleDateString('en-US', opts)}<br/>${start.toLocaleTimeString('en-US', timeOpts)} &ndash; ${end.toLocaleTimeString('en-US', timeOpts)} ${tzLabel}`
}

function generateGoogleCalendarUrl(title: string, startDate: string, endDate: string, description: string): string {
  const fmt = (d: string) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${encodeURIComponent(description)}&location=Live+Virtual`
}

function generateIcsContent(title: string, startDate: string, endDate: string, description: string): string {
  const fmt = (d: string) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  return `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${fmt(startDate)}\nDTEND:${fmt(endDate)}\nSUMMARY:${title}\nDESCRIPTION:${description}\nLOCATION:Live Virtual\nEND:VEVENT\nEND:VCALENDAR`
}

// ========== TEMPLATE 1: Registration Confirmation ==========
export function getRegistrationConfirmationEmail({
  customerName, eventTitle, startDate, endDate, timezone, hostNames, eventId, customerEmail,
}: {
  customerName: string; eventTitle: string; startDate: string; endDate: string; timezone: string; hostNames: string[]; eventId: string; customerEmail: string;
}): string {
  const dateStr = formatEventDate(startDate, endDate, timezone)
  const calUrl = generateGoogleCalendarUrl(eventTitle, startDate, endDate, `Night Vibe Workshop: ${eventTitle}`)
  const icsData = generateIcsContent(eventTitle, startDate, endDate, `Night Vibe Workshop: ${eventTitle}`)
  const icsBase64 = Buffer.from(icsData).toString('base64')
  const questionnaireUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nightvibe.ai'}/app-questionnaire?event_id=${eventId}&email=${encodeURIComponent(customerEmail)}`

  return emailWrapper(`
    <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 8px;line-height:1.2;text-align:center;">You're In! 🎉</h1>
    <p style="color:#10b981;font-size:16px;font-weight:600;text-align:center;margin:0 0 24px;">Registration Confirmed</p>

    <p style="color:#d1d5db;font-size:15px;line-height:1.65;">Hey ${customerName || 'there'},</p>
    <p style="color:#9ca3af;font-size:15px;line-height:1.65;">Your spot for <strong style="color:#a78bfa;">${eventTitle}</strong> is locked in. Here are your details:</p>

    <!-- Event Details Card -->
    <div style="background:rgba(108,58,237,0.06);border:1px solid rgba(108,58,237,0.15);border-radius:12px;padding:20px;margin:20px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:100px;">Event</td><td style="padding:8px 0;color:#ffffff;font-size:14px;font-weight:600;">${eventTitle}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;border-top:1px solid rgba(108,58,237,0.08);">When</td><td style="padding:8px 0;color:#ffffff;font-size:14px;font-weight:600;border-top:1px solid rgba(108,58,237,0.08);">${dateStr}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;border-top:1px solid rgba(108,58,237,0.08);">Where</td><td style="padding:8px 0;color:#ffffff;font-size:14px;font-weight:600;border-top:1px solid rgba(108,58,237,0.08);">Live Virtual (link sent before event)</td></tr>
        ${hostNames.length > 0 ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;border-top:1px solid rgba(108,58,237,0.08);">Hosts</td><td style="padding:8px 0;color:#2dd4bf;font-size:14px;font-weight:600;border-top:1px solid rgba(108,58,237,0.08);">${hostNames.join(', ')}</td></tr>` : ''}
      </table>
    </div>

    <!-- Calendar Buttons -->
    <div style="text-align:center;margin:24px 0;">
      <p style="color:#6b7280;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Add to Calendar</p>
      <a href="${calUrl}" target="_blank" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6c3aed,#a78bfa);color:#ffffff!important;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;margin:0 6px;">📅 Google Calendar</a>
      <a href="data:text/calendar;base64,${icsBase64}" download="${eventTitle.replace(/\s+/g, '_')}.ics" style="display:inline-block;padding:12px 24px;background:transparent;color:#a78bfa!important;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;border:2px solid rgba(108,58,237,0.4);margin:0 6px;">📅 Apple / Outlook</a>
    </div>

    <!-- App Questionnaire CTA -->
    <div style="background:linear-gradient(135deg,rgba(108,58,237,0.12),rgba(45,212,191,0.06));border:1px solid rgba(108,58,237,0.2);border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
      <p style="color:#ffffff;font-size:18px;font-weight:700;margin:0 0 8px;">What Are You Going to Build? 🛠️</p>
      <p style="color:#9ca3af;font-size:14px;margin:0 0 16px;line-height:1.6;">Before the workshop, tell us about your app idea so we can personalize your experience and help you hit the ground running.</p>
      <a href="${questionnaireUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6c3aed,#a78bfa);color:#ffffff!important;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;">Answer a Few Questions &rarr;</a>
    </div>

    <!-- What to Expect -->
    <h2 style="color:#ffffff;font-size:18px;font-weight:700;margin:24px 0 12px;">What to Expect</h2>
    <div style="color:#d1d5db;font-size:14px;line-height:1.8;">
      <div style="padding:6px 0;"><span style="color:#10b981;margin-right:8px;">✓</span> You'll go from idea to working prototype in 2 days</div>
      <div style="padding:6px 0;"><span style="color:#10b981;margin-right:8px;">✓</span> Live hands-on building with Claude and top AI tools</div>
      <div style="padding:6px 0;"><span style="color:#10b981;margin-right:8px;">✓</span> Direct support from your workshop hosts</div>
      <div style="padding:6px 0;"><span style="color:#10b981;margin-right:8px;">✓</span> Recording access &amp; free future workshop sessions included</div>
    </div>

    <!-- AppDash Promo -->
    <div style="background:rgba(45,212,191,0.08);border:1px solid rgba(45,212,191,0.2);border-radius:10px;padding:16px;margin:24px 0;text-align:center;">
      <p style="color:#2dd4bf;font-size:14px;font-weight:600;margin:0 0 4px;">Powered by AppDash.me</p>
      <p style="color:#6b7280;font-size:13px;margin:0;">Use code <strong style="color:#ffffff;">WKSHOP47</strong> for a special discount on your app deployment</p>
    </div>

    <p style="color:#9ca3af;font-size:14px;text-align:center;">See you at the workshop! 🚀</p>
  `)
}

// ========== TEMPLATE 2: Waitlist Confirmation ==========
export function getWaitlistConfirmationEmail({
  name, eventTitle, startDate,
}: {
  name: string; eventTitle?: string; startDate?: string;
}): string {
  return emailWrapper(`
    <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 8px;line-height:1.2;text-align:center;">You're on the List! 🔔</h1>
    <p style="color:#a78bfa;font-size:16px;font-weight:600;text-align:center;margin:0 0 24px;">Waitlist Confirmed</p>

    <p style="color:#d1d5db;font-size:15px;line-height:1.65;">Hey ${name},</p>
    <p style="color:#9ca3af;font-size:15px;line-height:1.65;">You've been added to the waitlist${eventTitle ? ` for <strong style="color:#a78bfa;">${eventTitle}</strong>` : ''}. We'll notify you immediately when:</p>

    <div style="background:rgba(108,58,237,0.06);border:1px solid rgba(108,58,237,0.15);border-radius:12px;padding:20px;margin:20px 0;">
      <div style="color:#d1d5db;font-size:14px;line-height:2;">
        <div><span style="color:#a78bfa;margin-right:8px;">→</span> A spot opens up in the current workshop</div>
        <div><span style="color:#a78bfa;margin-right:8px;">→</span> New workshop dates are announced</div>
        <div><span style="color:#a78bfa;margin-right:8px;">→</span> Early-bird pricing becomes available</div>
      </div>
    </div>

    ${startDate ? `<p style="color:#6b7280;font-size:13px;">Workshop date: <strong style="color:#9ca3af;">${new Date(startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong></p>` : ''}

    <div style="text-align:center;margin:28px 0;">
      <p style="color:#ffffff;font-size:16px;font-weight:600;margin:0 0 12px;">In the Meantime...</p>
      <p style="color:#9ca3af;font-size:14px;margin:0 0 16px;">Join our community and get a head start on your app journey.</p>
      <a href="https://nightvibe.ai" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#6c3aed,#a78bfa);color:#ffffff!important;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">Visit Night Vibe &rarr;</a>
    </div>
  `)
}

// ========== TEMPLATE 3: Pre-Event Reminder (3 days) ==========
export function getPreEventReminderEmail({
  customerName, eventTitle, startDate, endDate, timezone, hostNames, eventId, customerEmail,
}: {
  customerName: string; eventTitle: string; startDate: string; endDate: string; timezone: string; hostNames: string[]; eventId: string; customerEmail: string;
}): string {
  const dateStr = formatEventDate(startDate, endDate, timezone)
  const calUrl = generateGoogleCalendarUrl(eventTitle, startDate, endDate, `Night Vibe Workshop: ${eventTitle}`)
  const questionnaireUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nightvibe.ai'}/app-questionnaire?event_id=${eventId}&email=${encodeURIComponent(customerEmail)}`

  return emailWrapper(`
    <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 8px;line-height:1.2;text-align:center;">Your Workshop is in 3 Days! 📅</h1>
    <p style="color:#2dd4bf;font-size:15px;font-weight:600;text-align:center;margin:0 0 24px;">${dateStr}</p>

    <p style="color:#d1d5db;font-size:15px;line-height:1.65;">Hey ${customerName},</p>
    <p style="color:#9ca3af;font-size:15px;line-height:1.65;"><strong style="color:#a78bfa;">${eventTitle}</strong> is almost here! Here's how to prepare:</p>

    <h2 style="color:#ffffff;font-size:18px;font-weight:700;margin:24px 0 12px;">Pre-Workshop Checklist</h2>
    <div style="background:rgba(108,58,237,0.06);border:1px solid rgba(108,58,237,0.15);border-radius:12px;padding:20px;margin:16px 0;">
      <div style="color:#d1d5db;font-size:14px;line-height:2;">
        <div><span style="color:#10b981;margin-right:8px;">☐</span> Clear your calendar for the full workshop time</div>
        <div><span style="color:#10b981;margin-right:8px;">☐</span> Have a laptop or computer ready (not just a phone)</div>
        <div><span style="color:#10b981;margin-right:8px;">☐</span> Think about the app or business problem you want to solve</div>
        <div><span style="color:#10b981;margin-right:8px;">☐</span> Sign up for a free Claude account at claude.ai</div>
        <div><span style="color:#10b981;margin-right:8px;">☐</span> Have a notebook ready for ideas</div>
      </div>
    </div>

    <div style="text-align:center;margin:24px 0;">
      <a href="${calUrl}" target="_blank" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#6c3aed,#a78bfa);color:#ffffff!important;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">📅 Add to Calendar</a>
    </div>

    <!-- Questionnaire Nudge -->
    <div style="background:linear-gradient(135deg,rgba(108,58,237,0.12),rgba(45,212,191,0.06));border:1px solid rgba(108,58,237,0.2);border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
      <p style="color:#ffffff;font-size:15px;font-weight:600;margin:0 0 8px;">Haven't told us your app idea yet?</p>
      <p style="color:#9ca3af;font-size:13px;margin:0 0 12px;">Fill out the quick questionnaire so we can personalize your experience.</p>
      <a href="${questionnaireUrl}" style="display:inline-block;padding:10px 24px;background:transparent;color:#a78bfa!important;text-decoration:none;border-radius:10px;font-weight:600;font-size:13px;border:2px solid rgba(108,58,237,0.4);">Answer Questions &rarr;</a>
    </div>

    ${hostNames.length > 0 ? `<p style="color:#6b7280;font-size:13px;text-align:center;">Your hosts: <strong style="color:#2dd4bf;">${hostNames.join(', ')}</strong></p>` : ''}
  `)
}

// ========== TEMPLATE 4: Pre-Event Reminder (1 day) ==========
export function getPreEventReminderOneDayEmail({
  customerName, eventTitle, startDate, timezone, hostNames,
}: {
  customerName: string; eventTitle: string; startDate: string; timezone: string; hostNames: string[];
}): string {
  const tzNames: Record<string, string> = {
    'America/Los_Angeles': 'Pacific', 'America/New_York': 'Eastern',
    'America/Chicago': 'Central', 'America/Denver': 'Mountain',
  }
  const timeStr = new Date(startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: timezone })
  const tzLabel = tzNames[timezone] || timezone

  return emailWrapper(`
    <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 8px;line-height:1.2;text-align:center;">Tomorrow's the Day! 🚀</h1>
    <p style="color:#2dd4bf;font-size:16px;font-weight:600;text-align:center;margin:0 0 24px;">${timeStr} ${tzLabel}</p>

    <p style="color:#d1d5db;font-size:15px;line-height:1.65;">Hey ${customerName},</p>
    <p style="color:#9ca3af;font-size:15px;line-height:1.65;"><strong style="color:#a78bfa;">${eventTitle}</strong> starts tomorrow. Quick logistics:</p>

    <div style="background:rgba(108,58,237,0.06);border:1px solid rgba(108,58,237,0.15);border-radius:12px;padding:20px;margin:20px 0;">
      <div style="color:#d1d5db;font-size:14px;line-height:2;">
        <div><span style="color:#a78bfa;margin-right:8px;">⏰</span> Start time: <strong style="color:#fff;">${timeStr} ${tzLabel}</strong></div>
        <div><span style="color:#a78bfa;margin-right:8px;">💻</span> Platform: Live virtual (Zoom link coming 1hr before)</div>
        <div><span style="color:#a78bfa;margin-right:8px;">🧠</span> Have your app idea ready to go</div>
        <div><span style="color:#a78bfa;margin-right:8px;">🔋</span> Charge your laptop, grab coffee, bring energy</div>
      </div>
    </div>

    ${hostNames.length > 0 ? `
    <div style="text-align:center;margin:24px 0;">
      <p style="color:#6b7280;font-size:13px;margin:0 0 8px;">Your hosts</p>
      <p style="color:#2dd4bf;font-size:18px;font-weight:700;margin:0;">${hostNames.join(' & ')}</p>
      <p style="color:#9ca3af;font-size:14px;margin:8px 0 0;">can't wait to see what you build 🛠️</p>
    </div>` : ''}

    <p style="color:#9ca3af;font-size:14px;text-align:center;margin:24px 0 0;">See you tomorrow! Let's build something incredible.</p>
  `)
}

// ========== TEMPLATE 5: Pre-Event Reminder (1 hour) ==========
export function getPreEventReminderOneHourEmail({
  customerName, eventTitle, timezone, meetingLink,
}: {
  customerName: string; eventTitle: string; timezone: string; meetingLink?: string;
}): string {
  return emailWrapper(`
    <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 8px;line-height:1.2;text-align:center;">Starting in 1 Hour! ⚡</h1>

    <p style="color:#d1d5db;font-size:15px;line-height:1.65;margin-top:20px;">Hey ${customerName},</p>
    <p style="color:#9ca3af;font-size:15px;line-height:1.65;"><strong style="color:#a78bfa;">${eventTitle}</strong> kicks off in 60 minutes!</p>

    ${meetingLink ? `
    <div style="text-align:center;margin:28px 0;">
      <a href="${meetingLink}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#6c3aed,#a78bfa);color:#ffffff!important;text-decoration:none;border-radius:12px;font-weight:700;font-size:16px;">🎯 Join the Workshop Now</a>
    </div>` : `
    <div style="background:rgba(45,212,191,0.08);border:1px solid rgba(45,212,191,0.2);border-radius:10px;padding:16px;margin:24px 0;text-align:center;">
      <p style="color:#2dd4bf;font-size:14px;font-weight:600;margin:0;">Meeting link will be sent separately via email</p>
    </div>`}

    <h2 style="color:#ffffff;font-size:16px;font-weight:700;margin:24px 0 12px;">Quick Tips</h2>
    <div style="color:#d1d5db;font-size:14px;line-height:2;">
      <div><span style="color:#10b981;margin-right:8px;">⚡</span> Close distracting tabs and apps</div>
      <div><span style="color:#10b981;margin-right:8px;">⚡</span> Have claude.ai open in a browser tab</div>
      <div><span style="color:#10b981;margin-right:8px;">⚡</span> Keep a text file open for notes and prompts</div>
      <div><span style="color:#10b981;margin-right:8px;">⚡</span> Turn on Do Not Disturb</div>
    </div>

    <p style="color:#a78bfa;font-size:15px;font-weight:600;text-align:center;margin:28px 0 0;">Let's go build something amazing! 🚀</p>
  `)
}

// ========== TEMPLATE 6: New Event Notification (for waitlist) ==========
export function getNewEventNotificationEmail({
  name, eventTitle, startDate, endDate, price, seatsAvailable, registrationUrl,
}: {
  name: string; eventTitle: string; startDate: string; endDate: string; price: number; seatsAvailable: number; registrationUrl: string;
}): string {
  const start = new Date(startDate)
  const dateStr = start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return emailWrapper(`
    <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 8px;line-height:1.2;text-align:center;">A New Workshop Just Dropped! 🎯</h1>
    <p style="color:#2dd4bf;font-size:16px;font-weight:600;text-align:center;margin:0 0 24px;">You're getting early access</p>

    <p style="color:#d1d5db;font-size:15px;line-height:1.65;">Hey ${name},</p>
    <p style="color:#9ca3af;font-size:15px;line-height:1.65;">You're on our waitlist, which means you get first dibs. A brand new workshop just opened up:</p>

    <div style="background:rgba(108,58,237,0.06);border:1px solid rgba(108,58,237,0.15);border-radius:12px;padding:24px;margin:20px 0;text-align:center;">
      <h2 style="color:#a78bfa;font-size:22px;font-weight:800;margin:0 0 12px;">${eventTitle}</h2>
      <p style="color:#ffffff;font-size:15px;font-weight:600;margin:0 0 4px;">📅 ${dateStr}</p>
      <p style="color:#10b981;font-size:14px;font-weight:600;margin:0;">Only ${seatsAvailable} seats available &middot; $${price}</p>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a href="${registrationUrl}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#6c3aed,#a78bfa);color:#ffffff!important;text-decoration:none;border-radius:12px;font-weight:700;font-size:16px;">Claim Your Spot &rarr;</a>
    </div>

    <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:10px;padding:14px;margin:20px 0;text-align:center;">
      <p style="color:#ef4444;font-size:13px;font-weight:600;margin:0;">⚡ Limited to ${seatsAvailable} seats — once they're gone, they're gone</p>
    </div>
  `)
}
