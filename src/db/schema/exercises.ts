import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const exercises = pgTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  primaryMuscle: text("primary_muscle").notNull(),
  secondaryMuscles: text("secondary_muscles").array(),
  equipment: text("equipment").notNull(),
  videoUrl: text("video_url"),
  wikiUrl: text("wiki_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
