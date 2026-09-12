import { faker } from "@faker-js/faker";
import type { PrismaClient } from "../generated/prisma_client/client";
import type { BannerType } from "../generated/prisma_client/enums";

export interface CreateBannerInput {
  label?: string;
  type?: BannerType;
  position?: number;
  title?: string | null;
  description?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  telephone?: string | null;
  image?: string | null;
  color?: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
  visibleFrom?: Date;
}

export async function createBanner(
  prisma: PrismaClient,
  overrides: CreateBannerInput = {}
) {
  const type: BannerType =
    overrides.type ?? faker.helpers.arrayElement(["EVENT", "SPONSOR"] as const);

  const startsAt =
    overrides.startsAt !== undefined
      ? overrides.startsAt
      : type === "EVENT"
        ? faker.date.future({ years: 1 })
        : null;

  return prisma.banner.create({
    data: {
      label: overrides.label ?? faker.company.name(),
      type,
      position: overrides.position ?? faker.number.int({ min: 0, max: 10 }),
      title:
        overrides.title !== undefined
          ? overrides.title
          : faker.helpers.maybe(() => faker.music.songName(), {
              probability: 0.8,
            }) ?? null,
      description:
        overrides.description !== undefined
          ? overrides.description
          : faker.helpers.maybe(() => faker.lorem.paragraph({ min: 1, max: 3 }), {
              probability: 0.7,
            }) ?? null,
      website:
        overrides.website !== undefined
          ? overrides.website
          : faker.helpers.maybe(() => faker.internet.url(), {
              probability: 0.5,
            }) ?? null,
      instagram:
        overrides.instagram !== undefined
          ? overrides.instagram
          : faker.helpers.maybe(
              () => `https://www.instagram.com/${faker.internet.username()}/`,
              { probability: 0.4 }
            ) ?? null,
      facebook:
        overrides.facebook !== undefined
          ? overrides.facebook
          : faker.helpers.maybe(
              () => `https://www.facebook.com/${faker.internet.username()}`,
              { probability: 0.4 }
            ) ?? null,
      telephone:
        overrides.telephone !== undefined
          ? overrides.telephone
          : faker.helpers.maybe(() => faker.phone.number(), {
              probability: 0.4,
            }) ?? null,
      image: overrides.image ?? null,
      color:
        overrides.color ??
        faker.color.rgb({ format: "hex" }).replace("#", ""),
      startsAt,
      endsAt:
        overrides.endsAt !== undefined
          ? overrides.endsAt
          : startsAt
            ? new Date(startsAt.getTime() + faker.number.int({ min: 3600000, max: 86400000 }))
            : null,
      ...(overrides.visibleFrom !== undefined
        ? { visibleFrom: overrides.visibleFrom }
        : {}),
    },
  });
}
