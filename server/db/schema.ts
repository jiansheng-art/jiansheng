import { relations, sql } from 'drizzle-orm';
import { boolean, foreignKey, integer, pgTable, text, timestamp, unique, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).unique().notNull(),
  password: varchar({ length: 255 }).notNull(),
});

export const accessTokens = pgTable('access_tokens', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull(),
  token: text().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date()),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
  status: varchar({ length: 20 }).default('active'),
  userAgent: text(),
}, table => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: 'fk_user',
  }).onDelete('cascade'),
  unique('access_tokens_token_key').on(table.token),
]);

export const accessTokensRelations = relations(accessTokens, ({ one }) => ({
  users: one(users, {
    fields: [accessTokens.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accessTokens: many(accessTokens),
}));

export const contactForms = pgTable('contact_forms', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  firstName: varchar({ length: 255 }).notNull(),
  lastName: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  subject: varchar({ length: 255 }).notNull(),
  message: varchar({ length: 2000 }).notNull(),
  unread: boolean().default(true).notNull(),
  starred: boolean().default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
});

export const worksCategories = pgTable('works_categories', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
});

export const workSeries = pgTable('work_series', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  titleEnglish: varchar('title_english', { length: 255 }),
  description: varchar({ length: 2000 }),
});

export const works = pgTable('works', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  titleEnglish: varchar({ length: 255 }),
  description: varchar({ length: 2000 }),
  categoryId: integer('category_id'),
  seriesId: integer('series_id'),
  year: integer(),
  material: varchar({ length: 255 }),
  dimensions: varchar({ length: 255 }),
}, table => [
  foreignKey({
    columns: [table.categoryId],
    foreignColumns: [worksCategories.id],
    name: 'fk_category',
  }).onDelete('set null'),
  foreignKey({
    columns: [table.seriesId],
    foreignColumns: [workSeries.id],
    name: 'fk_series',
  }).onDelete('set null'),
]);

export const workImages = pgTable('work_images', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  workId: integer('work_id'),
  fileName: varchar({ length: 255 }),
  s3FileId: varchar({ length: 255 }).notNull(),
}, table => [
  foreignKey({
    columns: [table.workId],
    foreignColumns: [works.id],
    name: 'fk_work',
  }).onDelete('cascade'),
]);

export const workRelations = relations(works, ({ many, one }) => ({
  images: many(workImages),
  category: one(worksCategories),
  series: one(workSeries, {
    fields: [works.seriesId],
    references: [workSeries.id],
  }),
}));

export const workImageRelations = relations(workImages, ({ one }) => ({
  work: one(works, {
    fields: [workImages.workId],
    references: [works.id],
  }),
}));

export const worksCategoryRelations = relations(worksCategories, ({ many }) => ({
  works: many(works),
}));

export const workSeriesRelations = relations(workSeries, ({ many }) => ({
  works: many(works),
}));
