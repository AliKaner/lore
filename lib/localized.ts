"use client";

import { useMemo } from "react";
import type { WritingKind } from "@/convex/writingKinds";
import {
  ENTITY_KINDS,
  type EntityField,
  type EntityKind,
  type EntityKindConfig,
} from "@/convex/entityKinds";
import { KINDS, type KindConfig } from "@/lib/writingKinds";
import { intlLocale, useI18n, type Locale } from "@/lib/i18n";

// The kind configs (writing kinds, entity kinds) in the reader's language.
// They are written in Turkish once; every text in them goes through `t`.

type T = (text: string) => string;

function localizeWritingKind(cfg: KindConfig, t: T): KindConfig {
  return {
    ...cfg,
    label: t(cfg.label),
    untitled: t(cfg.untitled),
    pitch: t(cfg.pitch),
    traits: cfg.traits.map(t),
    unit: t(cfg.unit),
    unitTitlePlaceholder: t(cfg.unitTitlePlaceholder),
    firstUnitCta: t(cfg.firstUnitCta),
    continueCta: t(cfg.continueCta),
    mapLabel: t(cfg.mapLabel),
    branchCta: cfg.branchCta && t(cfg.branchCta),
    branchIntro: cfg.branchIntro && t(cfg.branchIntro),
    template: cfg.template && t(cfg.template),
  };
}

function localizeField(field: EntityField, t: T): EntityField {
  switch (field.type) {
    case "text":
      return {
        ...field,
        label: t(field.label),
        placeholder: field.placeholder && t(field.placeholder),
        suggestions: field.suggestions?.map(t),
      };
    case "longtext":
      return { ...field, label: t(field.label), placeholder: field.placeholder && t(field.placeholder) };
    case "link":
      return { ...field, label: t(field.label), reverse: t(field.reverse) };
    case "image":
      return { ...field, label: t(field.label), hint: t(field.hint) };
    case "lifespan":
      return { ...field, label: t(field.label) };
  }
}

function localizeEntityKind(cfg: EntityKindConfig, t: T): EntityKindConfig {
  return {
    ...cfg,
    label: t(cfg.label),
    plural: t(cfg.plural),
    namePlaceholder: t(cfg.namePlaceholder),
    summaryPlaceholder: t(cfg.summaryPlaceholder),
    sections: cfg.sections.map((section) => ({
      ...section,
      title: t(section.title),
      fields: section.fields.map((field) => localizeField(field, t)),
    })),
  };
}

function mapValues<K extends string, V, W>(record: Record<K, V>, fn: (value: V) => W): Record<K, W> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, fn(value as V)])) as Record<K, W>;
}

export function useWritingKinds(): Record<WritingKind, KindConfig> {
  const { t, locale } = useI18n();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => mapValues(KINDS, (cfg) => localizeWritingKind(cfg, t)), [locale]);
}

export function useKindConfig(book: { kind?: WritingKind } | null | undefined): KindConfig {
  return useWritingKinds()[book?.kind ?? "book"];
}

export function useEntityKinds(): Record<EntityKind, EntityKindConfig> {
  const { t, locale } = useI18n();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => mapValues(ENTITY_KINDS, (cfg) => localizeEntityKind(cfg, t)), [locale]);
}

// "Perşembe, 26 Kasım 2026" / "Thursday 26 November 2026", for dated pages.
export function todayTitle(locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(new Date());
}
