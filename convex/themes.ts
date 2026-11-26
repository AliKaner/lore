import { v, type Infer } from "convex/values";

// The colour themes a writer can pick (palettes in app/globals.css, names and
// swatches in lib/themes.ts). "booktion" is the default and follows the
// system's light/dark setting.
export const themeValidator = v.union(
  v.literal("booktion"),
  v.literal("cilek"),
  v.literal("kurbaga"),
  v.literal("at"),
  v.literal("gokyuzu"),
  v.literal("karanlik"),
  v.literal("gul"),
  v.literal("ates"),
  v.literal("pembik"),
);

export type ThemeId = Infer<typeof themeValidator>;
