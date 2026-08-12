import { and, desc, eq, sql } from "drizzle-orm";
import {
  assets,
  findings,
  headerReviews,
  programs,
  reportDrafts,
  type Asset,
  type Finding,
  type HeaderReview,
  type Program,
  type ReportDraft,
} from "../../drizzle/schema";
import { getDb } from "../db";

export type AccessScope = { userId: number; isAdmin: boolean };

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  return db;
}

function ownerClause<T>(ownerColumn: T, access: AccessScope) {
  return access.isAdmin ? undefined : eq(ownerColumn as never, access.userId);
}

export async function listPrograms(access: AccessScope): Promise<Program[]> {
  const db = await requireDb();
  return db.select().from(programs).where(ownerClause(programs.ownerId, access)).orderBy(desc(programs.updatedAt));
}

export async function getProgram(access: AccessScope, programId: number) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(programs)
    .where(and(eq(programs.id, programId), ownerClause(programs.ownerId, access)))
    .limit(1);
  return rows[0];
}

export async function createProgram(access: AccessScope, input: Omit<typeof programs.$inferInsert, "ownerId">) {
  const db = await requireDb();
  const result = await db.insert(programs).values({ ...input, ownerId: access.userId }).$returningId();
  return getProgram({ userId: access.userId, isAdmin: false }, result[0]!.id);
}

export async function updateProgram(access: AccessScope, id: number, input: Partial<Omit<typeof programs.$inferInsert, "id" | "ownerId">>) {
  const db = await requireDb();
  await db.update(programs).set(input).where(and(eq(programs.id, id), ownerClause(programs.ownerId, access)));
  return getProgram(access, id);
}

export async function listAssets(access: AccessScope): Promise<Asset[]> {
  const db = await requireDb();
  return db.select().from(assets).where(ownerClause(assets.ownerId, access)).orderBy(desc(assets.updatedAt));
}

export async function getAsset(access: AccessScope, assetId: number) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, assetId), ownerClause(assets.ownerId, access)))
    .limit(1);
  return rows[0];
}

export async function createAsset(access: AccessScope, input: Omit<typeof assets.$inferInsert, "ownerId">) {
  const db = await requireDb();
  const result = await db.insert(assets).values({ ...input, ownerId: access.userId }).$returningId();
  return getAsset({ userId: access.userId, isAdmin: false }, result[0]!.id);
}

export async function updateAsset(access: AccessScope, id: number, input: Partial<Omit<typeof assets.$inferInsert, "id" | "ownerId" | "programId">>) {
  const db = await requireDb();
  await db.update(assets).set(input).where(and(eq(assets.id, id), ownerClause(assets.ownerId, access)));
  return getAsset(access, id);
}

export async function listFindings(access: AccessScope): Promise<Finding[]> {
  const db = await requireDb();
  return db.select().from(findings).where(ownerClause(findings.ownerId, access)).orderBy(desc(findings.updatedAt));
}

export async function getFinding(access: AccessScope, findingId: number) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(findings)
    .where(and(eq(findings.id, findingId), ownerClause(findings.ownerId, access)))
    .limit(1);
  return rows[0];
}

export async function createFinding(access: AccessScope, input: Omit<typeof findings.$inferInsert, "ownerId">) {
  const db = await requireDb();
  const result = await db.insert(findings).values({ ...input, ownerId: access.userId }).$returningId();
  return getFinding({ userId: access.userId, isAdmin: false }, result[0]!.id);
}

export async function updateFinding(access: AccessScope, id: number, input: Partial<Omit<typeof findings.$inferInsert, "id" | "ownerId" | "programId">>) {
  const db = await requireDb();
  await db.update(findings).set(input).where(and(eq(findings.id, id), ownerClause(findings.ownerId, access)));
  return getFinding(access, id);
}

export async function saveReportDraft(access: AccessScope, input: Omit<typeof reportDrafts.$inferInsert, "ownerId">) {
  const db = await requireDb();
  const result = await db.insert(reportDrafts).values({ ...input, ownerId: access.userId }).$returningId();
  const rows = await db.select().from(reportDrafts).where(and(eq(reportDrafts.id, result[0]!.id), ownerClause(reportDrafts.ownerId, access))).limit(1);
  return rows[0] as ReportDraft;
}

export async function listReportDrafts(access: AccessScope): Promise<ReportDraft[]> {
  const db = await requireDb();
  return db.select().from(reportDrafts).where(ownerClause(reportDrafts.ownerId, access)).orderBy(desc(reportDrafts.updatedAt));
}

export async function listHeaderReviews(access: AccessScope, assetId: number): Promise<HeaderReview[]> {
  const db = await requireDb();
  return db
    .select()
    .from(headerReviews)
    .where(and(eq(headerReviews.assetId, assetId), ownerClause(headerReviews.ownerId, access)))
    .orderBy(desc(headerReviews.createdAt));
}

export async function saveHeaderReview(access: AccessScope, input: Omit<typeof headerReviews.$inferInsert, "ownerId">) {
  const db = await requireDb();
  const result = await db.insert(headerReviews).values({ ...input, ownerId: access.userId }).$returningId();
  const rows = await db.select().from(headerReviews).where(and(eq(headerReviews.id, result[0]!.id), ownerClause(headerReviews.ownerId, access))).limit(1);
  return rows[0] as HeaderReview;
}

export async function dashboardMetrics(access: AccessScope) {
  const db = await requireDb();
  const programRows = await db.select().from(programs).where(ownerClause(programs.ownerId, access));
  const assetRows = await db.select().from(assets).where(ownerClause(assets.ownerId, access));
  const findingRows = await db.select().from(findings).where(ownerClause(findings.ownerId, access));
  const severityCounts = findingRows.reduce<Record<string, number>>((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] ?? 0) + 1;
    return acc;
  }, { critical: 0, high: 0, medium: 0, low: 0, info: 0 });

  return {
    totals: {
      programs: programRows.length,
      assets: assetRows.length,
      findings: findingRows.length,
      verifiedAssets: assetRows.filter(asset => asset.authorizationStatus === "verified").length,
    },
    severityCounts,
    programStatus: programRows.reduce<Record<string, number>>((acc, program) => {
      acc[program.status] = (acc[program.status] ?? 0) + 1;
      return acc;
    }, { active: 0, paused: 0, completed: 0, archived: 0 }),
  };
}
