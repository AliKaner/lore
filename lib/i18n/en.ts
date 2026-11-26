import type { Entry } from "@/lib/translate";
import { COMMON } from "@/lib/i18n/common";
import { LANDING } from "@/lib/i18n/landing";
import { WRITING } from "@/lib/i18n/writing";
import { WORLD } from "@/lib/i18n/world";
import { ACCOUNT } from "@/lib/i18n/account";
import { SERVER } from "@/lib/i18n/server";
import { KINDS_EN } from "@/lib/i18n/kinds";

// English for every Turkish string of the interface, keyed by the Turkish.
export const EN: Record<string, Entry> = {
  ...COMMON,
  ...LANDING,
  ...WRITING,
  ...WORLD,
  ...ACCOUNT,
  ...SERVER,
  ...KINDS_EN,
};
