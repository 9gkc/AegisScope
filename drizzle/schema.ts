import { decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const programTypeEnum = mysqlEnum("programType", ["bug_bounty", "pentest", "internal_review"]);
export const programStatusEnum = mysqlEnum("programStatus", ["active", "paused", "completed", "archived"]);
export const assetTypeEnum = mysqlEnum("assetType", ["domain", "ip_address", "web_application"]);
export const assetStatusEnum = mysqlEnum("assetStatus", ["active", "paused", "retired"]);
export const authorizationStatusEnum = mysqlEnum("authorizationStatus", ["verified", "pending", "expired"]);
export const findingSeverityEnum = mysqlEnum("findingSeverity", ["critical", "high", "medium", "low", "info"]);
export const findingStatusEnum = mysqlEnum("findingStatus", ["open", "in_progress", "resolved", "accepted_risk", "closed"]);

export const programs = mysqlTable("programs", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  type: programTypeEnum.notNull(),
  status: programStatusEnum.default("active").notNull(),
  scopeNotes: text("scopeNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  programId: int("programId").notNull(),
  type: assetTypeEnum.notNull(),
  value: varchar("value", { length: 512 }).notNull(),
  normalizedValue: varchar("normalizedValue", { length: 512 }).notNull(),
  label: varchar("label", { length: 160 }),
  status: assetStatusEnum.default("active").notNull(),
  authorizationStatus: authorizationStatusEnum.default("pending").notNull(),
  authorizationEvidence: text("authorizationEvidence"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const findings = mysqlTable("findings", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  programId: int("programId").notNull(),
  assetId: int("assetId"),
  title: varchar("title", { length: 200 }).notNull(),
  severity: findingSeverityEnum.notNull(),
  cvssScore: decimal("cvssScore", { precision: 3, scale: 1 }),
  status: findingStatusEnum.default("open").notNull(),
  impact: text("impact").notNull(),
  testEnvironment: text("testEnvironment"),
  safePoc: text("safePoc"),
  remediation: text("remediation"),
  retestNotes: text("retestNotes"),
  evidenceMetadata: json("evidenceMetadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const reportDrafts = mysqlTable("reportDrafts", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  findingId: int("findingId").notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  markdown: text("markdown").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const headerReviews = mysqlTable("headerReviews", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  assetId: int("assetId").notNull(),
  targetUrl: varchar("targetUrl", { length: 512 }).notNull(),
  score: int("score").notNull(),
  observations: json("observations").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Program = typeof programs.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type Finding = typeof findings.$inferSelect;
export type ReportDraft = typeof reportDrafts.$inferSelect;
export type HeaderReview = typeof headerReviews.$inferSelect;
