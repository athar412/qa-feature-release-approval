export const state = {
  supabaseClient: null,
  db: null,
  currentUser: null,
  currentDocId: null,
  docStatus: 'PENDING',
  rejectionReason: '',
  activeSignatureRole: null,
  signedRoles: {},
  allHomeDocs: [],
  currentSigRole: null,
  sigCanvas: null,
  sigCtx: null,
  sigDrawing: false,
  PRISTINE_PAGE_HTML: '',
  SUPABASE_URL: 'https://crutsnnddasqbzdymjfs.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNydXRzbm5kZGFzcWJ6ZHltamZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NzU2MzUsImV4cCI6MjEwMDM1MTYzNX0.KN1jmW7axzbjz1QD3NSZwEKiEiHmiguQzim9w5UrEU0',
  CLOUD_API_BASE: 'https://kvdb.io/4y9pB2z8u3vX7W9qK1mN2a',
  HARDCODED_USERS: {
    'qa.lead': { pass: 'qa2026!', role: 'qa-lead', name: 'QA Lead', title: 'QA Lead / Specialist' },
    'tech.lead': { pass: 'tech2026!', role: 'tech-lead', name: 'Tech Lead', title: 'Engineering Lead / Tech Lead' },
    'manager.holycat': { pass: 'manager2026!', role: 'product-owner', name: 'Product Manager', title: 'Product Manager / Manager' }
  }
};
