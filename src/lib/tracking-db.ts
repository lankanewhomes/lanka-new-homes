import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

type LeadInput = {
  name: string;
  email: string;
  phone: string;
  preferredContactMethod: "Email" | "Phone" | "WhatsApp";
  message: string;
  projectSlug: string;
  developerSlug: string;
};

type ViewInput = {
  projectSlug: string;
  developerSlug: string;
  sessionId: string;
};

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "tracking.sqlite");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    preferred_contact_method TEXT NOT NULL,
    message TEXT NOT NULL,
    project_slug TEXT NOT NULL,
    developer_slug TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS project_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_slug TEXT NOT NULL,
    developer_slug TEXT NOT NULL,
    session_id TEXT NOT NULL,
    viewed_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_leads_developer ON leads (developer_slug, created_at);
  CREATE INDEX IF NOT EXISTS idx_views_developer ON project_views (developer_slug, viewed_at);
  CREATE INDEX IF NOT EXISTS idx_views_project ON project_views (project_slug, viewed_at);
`);

const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function insertLead(input: LeadInput) {
  const stmt = db.prepare(`
    INSERT INTO leads (
      id, name, email, phone, preferred_contact_method, message, project_slug, developer_slug, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const id = makeId();
  const createdAt = new Date().toISOString();

  stmt.run(
    id,
    input.name.trim(),
    input.email.trim().toLowerCase(),
    input.phone.trim(),
    input.preferredContactMethod,
    input.message.trim(),
    input.projectSlug,
    input.developerSlug,
    createdAt,
  );

  return { id, createdAt };
}

export function trackProjectView(input: ViewInput) {
  const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const existing = db
    .prepare(
      `SELECT id FROM project_views WHERE project_slug = ? AND session_id = ? AND viewed_at >= ? LIMIT 1`,
    )
    .get(input.projectSlug, input.sessionId, since) as { id: number } | undefined;

  if (existing) {
    return { inserted: false };
  }

  db.prepare(
    `INSERT INTO project_views (project_slug, developer_slug, session_id, viewed_at) VALUES (?, ?, ?, ?)`,
  ).run(input.projectSlug, input.developerSlug, input.sessionId, new Date().toISOString());

  return { inserted: true };
}

export function getDeveloperDashboardStats(developerSlug: string) {
  const totalLeadsRow = db
    .prepare(`SELECT COUNT(*) as total FROM leads WHERE developer_slug = ?`)
    .get(developerSlug) as { total: number };

  const totalViewsRow = db
    .prepare(`SELECT COUNT(*) as total FROM project_views WHERE developer_slug = ?`)
    .get(developerSlug) as { total: number };

  const newLeadsRow = db
    .prepare(
      `SELECT COUNT(*) as total FROM leads WHERE developer_slug = ? AND date(created_at) = date('now')`,
    )
    .get(developerSlug) as { total: number };

  return {
    totalLeads: totalLeadsRow?.total ?? 0,
    totalViews: totalViewsRow?.total ?? 0,
    newLeadsToday: newLeadsRow?.total ?? 0,
  };
}

export function getProjectPerformance(developerSlug: string) {
  const viewRows = db
    .prepare(
      `SELECT project_slug as projectSlug, COUNT(*) as views FROM project_views WHERE developer_slug = ? GROUP BY project_slug`,
    )
    .all(developerSlug) as Array<{ projectSlug: string; views: number }>;

  const leadRows = db
    .prepare(
      `SELECT project_slug as projectSlug, COUNT(*) as leads FROM leads WHERE developer_slug = ? GROUP BY project_slug`,
    )
    .all(developerSlug) as Array<{ projectSlug: string; leads: number }>;

  const viewsMap = new Map(viewRows.map((row) => [row.projectSlug, row.views]));
  const leadsMap = new Map(leadRows.map((row) => [row.projectSlug, row.leads]));

  return { viewsMap, leadsMap };
}
