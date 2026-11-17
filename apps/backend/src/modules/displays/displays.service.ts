import { prisma, Prisma } from "@mysagra/database";
import {
    CreateDisplayInput,
    UpdateDisplayInput,
    PatchDisplayInput,
    GetDisplayQuery,
} from "@mysagra/schemas";
import { NotFoundError } from "@/common/errors";
import { EventsService } from "../events/events.service";

type DisplayWithStations = Prisma.DisplayGetPayload<{ include: { stations: true } }>;

// The API exposes the relation as stationIds; the full stations only when requested with include=stations
function toResponse({ stations, ...display }: DisplayWithStations, withStations = false) {
    return {
        ...display,
        stationIds: stations.map(station => station.id),
        ...(withStations && { stations })
    };
}

function toStationRefs(stationIds: string[]) {
    return stationIds.map(id => ({ id }));
}

class DisplaysService {
    private event = EventsService.getInstance('display')

    // Every display receives the event and applies it only when the id is its own
    private broadcastUpdate(display: ReturnType<typeof toResponse>) {
        this.event.broadcastEvent(display, "display-update");
        return display;
    }

    async getDisplays(query: GetDisplayQuery = {}) {
        const displays = await prisma.display.findMany({
            include: { stations: true },
            orderBy: { name: "asc" }
        });

        return displays.map(display => toResponse(display, query.include === "stations"));
    }

    async getDisplayById(id: string, query: GetDisplayQuery = {}) {
        const display = await prisma.display.findUnique({
            where: { id },
            include: { stations: true }
        });

        if (!display) {
            throw new NotFoundError("Display not found");
        }

        return toResponse(display, query.include === "stations");
    }

    async createDisplay({ stationIds, ...display }: CreateDisplayInput) {
        const createdDisplay = await prisma.display.create({
            data: {
                ...display,
                stations: { connect: toStationRefs(stationIds) }
            },
            include: { stations: true }
        });

        return toResponse(createdDisplay);
    }

    async updateDisplay(id: string, { stationIds, ...display }: UpdateDisplayInput) {
        const updatedDisplay = await prisma.display.update({
            where: { id },
            data: {
                ...display,
                stations: { set: toStationRefs(stationIds) }
            },
            include: { stations: true }
        });

        return this.broadcastUpdate(toResponse(updatedDisplay));
    }

    async patchDisplay(id: string, { stationIds, ...settings }: PatchDisplayInput) {
        const patchedDisplay = await prisma.display.update({
            where: { id },
            data: {
                ...settings,
                ...(stationIds && { stations: { set: toStationRefs(stationIds) } })
            },
            include: { stations: true }
        });

        return this.broadcastUpdate(toResponse(patchedDisplay));
    }

    async deleteDisplay(id: string) {
        return await prisma.display.delete({ where: { id } });
    }
}

export const displaysService = new DisplaysService();
