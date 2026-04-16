import { faker } from "@faker-js/faker";
import type { PrismaClient } from "../generated/prisma_client/client";
import type { BannerType } from "../generated/prisma_client/enums";

export interface CreateBannerInput {
  label?: string;
  type?: BannerType;
  title?: string | null;
  description?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  image?: string | null;
  color?: string;
  dateTime?: Date | null;
}

export async function createBanner(
  prisma: PrismaClient,
  overrides: CreateBannerInput = {}
) {
  const type: BannerType =
    overrides.type ?? faker.helpers.arrayElement(["EVENT", "SPONSOR"] as const);

  return prisma.banner.create({
    data: {
      label: overrides.label ?? faker.company.name(),
      type,
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
      image: overrides.image ?? null,
      color:
        overrides.color ??
        faker.color.rgb({ format: "hex" }).replace("#", ""),
      dateTime:
        overrides.dateTime !== undefined
          ? overrides.dateTime
          : type === "EVENT"
            ? faker.date.future({ years: 1 })
            : null,
    },
  });
}
