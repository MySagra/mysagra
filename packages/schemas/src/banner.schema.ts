import { z } from 'zod'

export const BannerEnumSchema = z.enum(["EVENT", "SPONSOR"])

export const BannerInputSchema = z.object({
    label: z.string().max(100).meta({
        description: "Internal label used to identify the banner in the management panel",
        example: "Queen band event"
    }),
    type: z.string().transform(v => v.toUpperCase()).pipe(BannerEnumSchema).meta({
        description: "Determines whether the banner promotes a festival event or a sponsor. Accepted values: EVENT, SPONSOR",
        example: "EVENT"
    }),
    title: z.string().max(100).optional().nullable().meta({
        description: "Headline displayed on the banner card in the UI. Null if not provided",
        example: "Queen – A Night at the Opera"
    }),
    description: z.string().max(250).optional().nullable().meta({
        description: "Short body text displayed beneath the title on the banner card. Null if not provided",
        example: "The legendary Queen band performs their iconic album live on stage."
    }),
    website: z.url().optional().nullable().meta({
        description: "Official website URL shown as a link button on the banner. Null if not provided",
        example: "https://www.queenonline.com/"
    }),
    facebook: z.url().optional().nullable().meta({
        description: "Facebook page URL shown as a social link on the banner. Null if not provided",
        example: "https://www.facebook.com/Queen"
    }),
    instagram: z.url().optional().nullable().meta({
        description: "Instagram profile URL shown as a social link on the banner. Null if not provided",
        example: "https://www.instagram.com/officialqueenmusic/"
    }),
    color: z.string().transform(v => v.replace(/^#/, '')).pipe(z.hex()).optional().default("fecc01").meta({
        description: "Hex color code used for action buttons and accents on the banner card. Defaults to #fecc01",
        example: "#fecc01"
    }),
    dateTime: z.coerce.date().optional().nullable().meta({
        description: "Date and time of the event displayed on the banner. Only relevant when type is 'event'. Null if not applicable",
        example: "2026-07-15T21:00:00.000Z"
    })
})

export const BannerResponseSchema = BannerInputSchema.extend({
    id: z.cuid().meta({
        description: "Unique identifier of the banner",
        example: "clxyz1234abcd5678efgh9012"
    }),
    image: z.string().nullable().meta({
        description: "ID of the uploaded image asset associated with the banner. Null if no image has been uploaded",
        example: "category-clxyz1234abcd5678efgh9012"
    })
})

export type BannerInput = z.infer<typeof BannerInputSchema>
export type BannerEnum = z.infer<typeof BannerEnumSchema>
export type BannerResponse = z.infer<typeof BannerResponseSchema>