"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { markStyleOf, type EntityField } from "@/convex/entityKinds";
import { parseMentions } from "@/lib/mentions";
import { EntityChip, KindGlyph, eyebrow, type Chip } from "@/components/entity/shared";
import FavoriteButton from "@/components/FavoriteButton";
import FamilyTree from "@/components/entity/FamilyTree";
import Loading from "@/components/Loading";
import NotFoundState from "@/components/NotFoundState";
import { useCommunityOpen } from "@/lib/community";
import { useT } from "@/lib/i18n";
import { useEntityKinds } from "@/lib/localized";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 border-b border-border/70 py-2.5 last:border-b-0 sm:grid-cols-[10rem_1fr] sm:items-baseline">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 text-[15px] leading-relaxed">{children}</dd>
    </div>
  );
}

// A reader's page for one named thing of a writing: only what the writer
// filled in, and only links to other things of that writing.
export default function EntityView({
  entityId,
  bookId,
}: {
  entityId: Id<"entities">;
  bookId: Id<"books">;
}) {
  const entity = useQuery(api.entities.get, { entityId, bookId });
  const book = useQuery(api.books.get, { bookId });
  const named = useQuery(api.entities.listForBook, { bookId });
  const communityOpen = useCommunityOpen();
  const t = useT();
  const kinds = useEntityKinds();

  if (entity === undefined) return <Loading />;
  if (entity === null) return <NotFoundState title={t("Bu kayıt bulunamadı")} />;

  const config = kinds[entity.kind];
  const hrefFor = (id: Id<"entities">) => `/book/${bookId}/world/${id}`;
  const chips = (list: Chip[]) => (
    <div className="flex flex-wrap gap-1.5">
      {list.map((chip) => (
        <EntityChip key={chip._id} chip={chip} href={hrefFor(chip._id)} />
      ))}
    </div>
  );
  // "@" mentions link to things of this writing; others read as plain names.
  const inBook = new Map((named ?? []).map((e) => [e._id as string, e]));
  const withMentions = (text: string) =>
    parseMentions(text).map((part, index) => {
      if (typeof part === "string") return part;
      const target = inBook.get(part.id);
      if (!target) return <span key={index}>{part.name}</span>;
      return (
        <Link
          key={index}
          href={hrefFor(target._id)}
          title={target.summary ?? undefined}
          className={`underline decoration-[1.5px] underline-offset-[3px] transition-colors hover:text-accent ${
            { character: "decoration-caramel", place: "decoration-sapphire decoration-dotted", thing: "decoration-sapphire decoration-dashed" }[
              markStyleOf(target.kind)
            ]
          }`}
        >
          {target.name}
        </Link>
      );
    });
  const pictures = entity.images.filter((image) => image.slot === null);
  const [portrait, ...rest] = pictures;

  function rowFor(field: EntityField) {
    switch (field.type) {
      case "text":
      case "longtext": {
        const value = entity!.fields[field.key];
        if (!value) return null;
        return (
          <Row key={field.key} label={field.label}>
            <span className="whitespace-pre-line">{field.type === "longtext" ? withMentions(value) : value}</span>
          </Row>
        );
      }
      case "lifespan": {
        const { age, birthYear } = entity!.fields;
        if (!age && !birthYear) return null;
        return (
          <Row key={field.key} label={age ? t("Yaşı") : t("Doğum yılı")}>
            {age || birthYear}
          </Row>
        );
      }
      case "link": {
        const list = entity!.links[field.key] ?? [];
        if (list.length === 0) return null;
        return (
          <Row key={field.key} label={field.label}>
            {chips(list)}
          </Row>
        );
      }
      case "image": {
        const image = entity!.images.find((i) => i.slot === field.key);
        if (!image?.url) return null;
        return (
          <a key={field.key} href={image.url} target="_blank" rel="noreferrer" className="block py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={`${entity!.name} — ${field.label}`} className="w-full rounded-xl border border-border" />
          </a>
        );
      }
    }
  }

  const family = entity.family;
  const familyRows: [string, Chip[]][] = family
    ? (
        [
          [t("Kardeşleri"), family.siblings],
          [t("Çocukları"), family.children],
          [t("Büyükanne ve büyükbabaları"), family.grandparents],
        ] as [string, Chip[]][]
      ).filter(([, list]) => list.length > 0)
    : [];

  return (
    <article className="grid gap-10 lg:grid-cols-[17rem_1fr] lg:gap-14">
      <aside className={`mx-auto w-full max-w-[18rem] lg:sticky lg:top-8 lg:max-w-none lg:self-start ${portrait?.url ? "" : "hidden lg:block"}`}>
        {portrait?.url ? (
          <a href={portrait.url} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={portrait.url} alt={entity.name} className="aspect-[4/5] w-full rounded-2xl border border-border object-cover" />
          </a>
        ) : (
          <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl border border-border bg-surface">
            <KindGlyph kind={entity.kind} size="lg" />
          </div>
        )}
        {rest.length > 0 && (
          <ul className="mt-2 grid grid-cols-4 gap-2">
            {rest.map((image) =>
              image.url ? (
                <li key={image.storageId}>
                  <a href={image.url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt="" className="aspect-square w-full rounded-lg border border-border object-cover" />
                  </a>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </aside>

      <div className="min-w-0">
        <div className="flex items-center justify-between gap-4">
          <p className={`${eyebrow} inline-flex items-center gap-2 text-caramel`}>
            <KindGlyph kind={entity.kind} />
            {config.label}
            {book && (
              <>
                <span className="text-muted">·</span>
                <Link href={`/book/${bookId}`} className="normal-case tracking-normal text-muted hover:text-foreground">
                  {book.title}
                </Link>
              </>
            )}
          </p>
          {communityOpen && <FavoriteButton targetType="entity" targetId={entity._id} />}
        </div>
        <h1 className="mt-3 font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">{entity.name}</h1>
        {entity.summary && <p className="mt-3 font-display text-xl italic text-muted">{entity.summary}</p>}

        <div className="mt-10 flex flex-col gap-10">
          {config.sections.map((section) => {
            const rows = section.fields.map(rowFor).filter(Boolean);
            const isFamily = section.fields.some((f) => f.key === "father");
            if (rows.length === 0 && !(isFamily && familyRows.length > 0)) return null;
            return (
              <section key={section.title}>
                <h2 className="border-b border-border pb-2 font-display text-2xl">{section.title}</h2>
                <dl>
                  {rows}
                  {isFamily &&
                    familyRows.map(([label, list]) => (
                      <Row key={label} label={label}>
                        {chips(list)}
                      </Row>
                    ))}
                </dl>
              </section>
            );
          })}

          {entity.custom.length > 0 && (
            <section>
              <h2 className="border-b border-border pb-2 font-display text-2xl">{t("Diğer")}</h2>
              <dl>
                {entity.custom.map((entry, index) => (
                  <Row key={index} label={entry.label}>
                    <span className="whitespace-pre-line">{entry.value}</span>
                  </Row>
                ))}
              </dl>
            </section>
          )}

          {entity.kind === "character" && <FamilyTree entityId={entity._id} bookId={bookId} />}

          {entity.incoming.length > 0 && (
            <section>
              <h2 className="border-b border-border pb-2 font-display text-2xl">{t("Bağlantıları")}</h2>
              <dl>
                {entity.incoming.map((group) => (
                  <Row key={group.label} label={t(group.label)}>
                    {chips(group.items)}
                  </Row>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
