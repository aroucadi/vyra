import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const exercises = pgTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  primaryMuscle: text("primary_muscle").notNull(),
  secondaryMuscles: text("secondary_muscles").array(),
  equipment: text("equipment").notNull(),
  videoUrl: text("video_url"),
  wikiUrl: text("wiki_url"),
  muscleWikiId: integer("muscle_wiki_id"),
  difficulty: text("difficulty"),
  steps: text("steps").array(),
  mediaUrls: text("media_urls").array(),
  muscleWikiUrl: text("muscle_wiki_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
