import { z } from 'zod'

import { StationInputSchema } from "./station.schema"

export const DisplayViewEnum = z.enum(["READY", "PREPARING", "HYBRID"]).meta({
    id: "DisplayView",
    description: "What the public display shows: only ready orders, only orders in preparation, or both",
    example: "READY"
})

const DisplayBase = {
    name: z.string().min(1).max(100).meta({
        description: "Name of the display",
        example: "Display ingresso"
    }),
    description: z.string().max(250).nullable().meta({
        description: "Optional description of the display's location or purpose",
        example: "Schermo vicino alla cassa"
    }),
    view: DisplayViewEnum,
    showAlert: z.boolean().meta({
        description: "Show a fullscreen overlay when an order is ready"
    }),
    autoScroll: z.boolean().meta({
        description: "Automatically scroll through the order pages"
    }),
    stationIds: z.array(z.cuid()).meta({
        description: "Identifiers of the stations whose orders are shown on the display"
    })
}

export const CreateDisplaySchema = z.object({
    ...DisplayBase,
    description: DisplayBase.description.optional(),
    view: DisplayBase.view.default("READY"),
    showAlert: DisplayBase.showAlert.default(true),
    autoScroll: DisplayBase.autoScroll.default(true),
    stationIds: DisplayBase.stationIds.default([])
}).meta({
    id: "CreateDisplayRequest",
    description: "Payload required to create a new display"
})

export const UpdateDisplaySchema = z.object({
    ...DisplayBase
}).meta({
    id: "UpdateDisplayRequest",
    description: "Payload required to update a display"
})

export const PatchDisplaySchema = z.object({
    view: DisplayBase.view.optional(),
    showAlert: DisplayBase.showAlert.optional(),
    autoScroll: DisplayBase.autoScroll.optional(),
    stationIds: DisplayBase.stationIds.optional()
}).meta({
    id: "PatchDisplayRequest",
    description: "Payload required to patch a display's settings"
})

export const GetDisplayQuerySchema = z.object({
    include: z.enum(["stations"]).optional().meta({
        description: "Relations to include in response"
    })
}).meta({
    id: "GetDisplayQuery",
    description: "Query parameters for retrieving displays"
})

const DisplayResponseBase = {
    id: z.cuid().meta({
        description: "Unique identifier for the display"
    }),
    ...DisplayBase
}

export const DisplayResponseSchema = z.object({
    ...DisplayResponseBase
}).meta({
    id: "DisplayResponse",
    description: "Display entity, with its stations as identifiers"
})

// Only the station's own columns: categories are never loaded for a display
export const DisplayStationSchema = StationInputSchema.extend({
    id: z.cuid().meta({
        description: "Unique identifier of the station"
    })
}).meta({
    id: "DisplayStation",
    description: "Station shown on a display"
})

export const DisplayWithStationsResponseSchema = z.object({
    ...DisplayResponseBase,
    stations: z.array(DisplayStationSchema).optional().meta({
        description: "Stations shown on the display, present only with include=stations"
    })
}).meta({
    id: "DisplayWithStationsResponse",
    description: "Display entity, with the full stations when requested with include=stations"
})

export type DisplayView = z.infer<typeof DisplayViewEnum>
export type CreateDisplayInput = z.infer<typeof CreateDisplaySchema>
export type UpdateDisplayInput = z.infer<typeof UpdateDisplaySchema>
export type PatchDisplayInput = z.infer<typeof PatchDisplaySchema>
export type GetDisplayQuery = z.infer<typeof GetDisplayQuerySchema>
export type DisplayResponse = z.infer<typeof DisplayResponseSchema>
export type DisplayStation = z.infer<typeof DisplayStationSchema>
export type DisplayWithStationsResponse = z.infer<typeof DisplayWithStationsResponseSchema>
