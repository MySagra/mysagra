import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { Prisma } from "@mysagra/database";
import {
    CreateDisplaySchema,
    UpdateDisplaySchema,
    PatchDisplaySchema,
    SessionPayload,
} from "@mysagra/schemas";

// Only the prisma client is replaced: Prisma error classes stay real so errorHandler maps them
const display = vi.hoisted(() => ({
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
}));

vi.mock("@mysagra/database", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@mysagra/database")>()),
    prisma: { display },
}));

import { registerModules } from "@/core/http";
import { errorHandler } from "@/middlewares/errorHandler";
import { displaysModule } from "@/modules/displays/displays.route";
import { generateOpenApiDocument } from "@/core/http/openapi";
import { EventsService } from "@/modules/events/events.service";

const DISPLAY_ID = "clv1abc2defghijklmnopqrst";
const STATION_A = "clv1def2ghijklmnopqrstuvw";
const STATION_B = "clv1ghi2jklmnopqrstuvwxyz";

const stationA = { id: STATION_A, name: "Cucina" };
const stationB = { id: STATION_B, name: "Bar" };

const dbDisplay = {
    id: DISPLAY_ID,
    name: "Display ingresso",
    description: null,
    view: "READY",
    showAlert: true,
    autoScroll: true,
    stations: [stationA, stationB],
};

const validBody = {
    name: "Display ingresso",
    description: null,
    view: "HYBRID",
    showAlert: false,
    autoScroll: true,
    stationIds: [STATION_A, STATION_B],
};

function prismaError(code: string) {
    return new Prisma.PrismaClientKnownRequestError("error", { code, clientVersion: "test" });
}

function buildApp(role: SessionPayload["role"] | null = "admin") {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
        if (role) req.user = { userId: "clv1usr2defghijklmnopqrst", username: "test", role };
        next();
    });
    app.use(registerModules([displaysModule]));
    app.use(errorHandler);
    return app;
}

const displayEvent = EventsService.getInstance("display");

beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.spyOn(displayEvent, "broadcastEvent").mockImplementation(() => {});
});

describe("display schemas", () => {
    it("fills the defaults on create", () => {
        expect(CreateDisplaySchema.parse({ name: "Display" })).toEqual({
            name: "Display",
            view: "READY",
            showAlert: true,
            autoScroll: true,
            stationIds: [],
        });
    });

    it("rejects an unknown view", () => {
        expect(CreateDisplaySchema.safeParse({ name: "Display", view: "ALL" }).success).toBe(false);
    });

    it("rejects an empty or too long name", () => {
        expect(CreateDisplaySchema.safeParse({ name: "" }).success).toBe(false);
        expect(CreateDisplaySchema.safeParse({ name: "x".repeat(101) }).success).toBe(false);
    });

    it("rejects station ids that are not cuids", () => {
        expect(CreateDisplaySchema.safeParse({ name: "Display", stationIds: ["1"] }).success).toBe(false);
    });

    it("accepts the hybrid view with any number of stations", () => {
        const stationIds = Array.from({ length: 6 }, () => STATION_A);
        expect(CreateDisplaySchema.safeParse({ name: "Display", view: "HYBRID", stationIds }).success).toBe(true);
    });

    it("requires every field on update", () => {
        expect(UpdateDisplaySchema.safeParse(validBody).success).toBe(true);
        const { stationIds: _, ...withoutStations } = validBody;
        expect(UpdateDisplaySchema.safeParse(withoutStations).success).toBe(false);
    });

    it("accepts partial settings on patch", () => {
        expect(PatchDisplaySchema.parse({})).toEqual({});
        expect(PatchDisplaySchema.parse({ view: "PREPARING" })).toEqual({ view: "PREPARING" });
    });
});

describe("GET /v1/displays", () => {
    it("returns the displays with stationIds and without the full stations", async () => {
        display.findMany.mockResolvedValue([dbDisplay]);

        const res = await request(buildApp()).get("/v1/displays");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([{
            id: DISPLAY_ID,
            name: "Display ingresso",
            description: null,
            view: "READY",
            showAlert: true,
            autoScroll: true,
            stationIds: [STATION_A, STATION_B],
        }]);
        expect(display.findMany).toHaveBeenCalledWith({
            include: { stations: true },
            orderBy: { name: "asc" },
        });
    });

    it("returns the full stations with include=stations", async () => {
        display.findMany.mockResolvedValue([dbDisplay]);

        const res = await request(buildApp()).get("/v1/displays?include=stations");

        expect(res.status).toBe(200);
        expect(res.body[0].stations).toEqual([stationA, stationB]);
        expect(res.body[0].stationIds).toEqual([STATION_A, STATION_B]);
    });

    it("rejects an unknown include", async () => {
        const res = await request(buildApp()).get("/v1/displays?include=categories");

        expect(res.status).toBe(400);
        expect(display.findMany).not.toHaveBeenCalled();
    });

    it("is readable by operators", async () => {
        display.findMany.mockResolvedValue([]);

        const res = await request(buildApp("operator")).get("/v1/displays");

        expect(res.status).toBe(200);
    });

    it("requires authentication", async () => {
        const res = await request(buildApp(null)).get("/v1/displays");

        expect(res.status).toBe(401);
    });
});

describe("GET /v1/displays/{id}", () => {
    it("returns the display", async () => {
        display.findUnique.mockResolvedValue(dbDisplay);

        const res = await request(buildApp()).get(`/v1/displays/${DISPLAY_ID}`);

        expect(res.status).toBe(200);
        expect(res.body.stationIds).toEqual([STATION_A, STATION_B]);
        expect(res.body.stations).toBeUndefined();
        expect(display.findUnique).toHaveBeenCalledWith({
            where: { id: DISPLAY_ID },
            include: { stations: true },
        });
    });

    it("returns 404 when the display does not exist", async () => {
        display.findUnique.mockResolvedValue(null);

        const res = await request(buildApp()).get(`/v1/displays/${DISPLAY_ID}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Display not found");
    });

    it("rejects an id that is not a cuid", async () => {
        const res = await request(buildApp()).get("/v1/displays/1");

        expect(res.status).toBe(400);
        expect(display.findUnique).not.toHaveBeenCalled();
    });
});

describe("POST /v1/displays", () => {
    it("creates the display connecting its stations", async () => {
        display.create.mockResolvedValue({ ...dbDisplay, stations: [stationA] });

        const res = await request(buildApp())
            .post("/v1/displays")
            .send({ name: "Display ingresso", stationIds: [STATION_A] });

        expect(res.status).toBe(201);
        expect(res.body.stationIds).toEqual([STATION_A]);
        expect(display.create).toHaveBeenCalledWith({
            data: {
                name: "Display ingresso",
                view: "READY",
                showAlert: true,
                autoScroll: true,
                stations: { connect: [{ id: STATION_A }] },
            },
            include: { stations: true },
        });
    });

    it("returns 409 when the name already exists", async () => {
        display.create.mockRejectedValue(prismaError("P2002"));

        const res = await request(buildApp()).post("/v1/displays").send({ name: "Display ingresso" });

        expect(res.status).toBe(409);
    });

    it("returns 404 when a station does not exist", async () => {
        display.create.mockRejectedValue(prismaError("P2025"));

        const res = await request(buildApp())
            .post("/v1/displays")
            .send({ name: "Display ingresso", stationIds: [STATION_A] });

        expect(res.status).toBe(404);
    });

    it("rejects an invalid body", async () => {
        const res = await request(buildApp()).post("/v1/displays").send({ name: "" });

        expect(res.status).toBe(400);
        expect(display.create).not.toHaveBeenCalled();
    });

    it("is reserved to admins", async () => {
        const res = await request(buildApp("maintainer")).post("/v1/displays").send({ name: "Display" });

        expect(res.status).toBe(403);
        expect(display.create).not.toHaveBeenCalled();
    });
});

describe("PUT /v1/displays/{id}", () => {
    it("replaces the display and its stations", async () => {
        display.update.mockResolvedValue({ ...dbDisplay, view: "HYBRID", showAlert: false });

        const res = await request(buildApp("maintainer")).put(`/v1/displays/${DISPLAY_ID}`).send(validBody);

        expect(res.status).toBe(200);
        expect(res.body.view).toBe("HYBRID");
        expect(display.update).toHaveBeenCalledWith({
            where: { id: DISPLAY_ID },
            data: {
                name: "Display ingresso",
                description: null,
                view: "HYBRID",
                showAlert: false,
                autoScroll: true,
                stations: { set: [{ id: STATION_A }, { id: STATION_B }] },
            },
            include: { stations: true },
        });
    });

    it("returns 404 when the display does not exist", async () => {
        display.update.mockRejectedValue(prismaError("P2025"));

        const res = await request(buildApp()).put(`/v1/displays/${DISPLAY_ID}`).send(validBody);

        expect(res.status).toBe(404);
    });

    it("is not allowed to operators", async () => {
        const res = await request(buildApp("operator")).put(`/v1/displays/${DISPLAY_ID}`).send(validBody);

        expect(res.status).toBe(403);
        expect(display.update).not.toHaveBeenCalled();
    });
});

describe("PATCH /v1/displays/{id}", () => {
    it("updates only the given settings and leaves the stations untouched", async () => {
        display.update.mockResolvedValue({ ...dbDisplay, view: "PREPARING" });

        const res = await request(buildApp()).patch(`/v1/displays/${DISPLAY_ID}`).send({ view: "PREPARING" });

        expect(res.status).toBe(200);
        expect(res.body.view).toBe("PREPARING");
        expect(display.update).toHaveBeenCalledWith({
            where: { id: DISPLAY_ID },
            data: { view: "PREPARING" },
            include: { stations: true },
        });
    });

    it("replaces the stations when stationIds is given, even empty", async () => {
        display.update.mockResolvedValue({ ...dbDisplay, stations: [] });

        const res = await request(buildApp()).patch(`/v1/displays/${DISPLAY_ID}`).send({ stationIds: [] });

        expect(res.status).toBe(200);
        expect(res.body.stationIds).toEqual([]);
        expect(display.update).toHaveBeenCalledWith({
            where: { id: DISPLAY_ID },
            data: { stations: { set: [] } },
            include: { stations: true },
        });
    });

    it("returns 404 when the display does not exist", async () => {
        display.update.mockRejectedValue(prismaError("P2025"));

        const res = await request(buildApp()).patch(`/v1/displays/${DISPLAY_ID}`).send({ showAlert: false });

        expect(res.status).toBe(404);
    });
});

describe("DELETE /v1/displays/{id}", () => {
    it("deletes the display", async () => {
        display.delete.mockResolvedValue(dbDisplay);

        const res = await request(buildApp()).delete(`/v1/displays/${DISPLAY_ID}`);

        expect(res.status).toBe(204);
        expect(display.delete).toHaveBeenCalledWith({ where: { id: DISPLAY_ID } });
    });

    it("returns 404 when the display does not exist", async () => {
        display.delete.mockRejectedValue(prismaError("P2025"));

        const res = await request(buildApp()).delete(`/v1/displays/${DISPLAY_ID}`);

        expect(res.status).toBe(404);
    });

    it("is reserved to admins", async () => {
        const res = await request(buildApp("maintainer")).delete(`/v1/displays/${DISPLAY_ID}`);

        expect(res.status).toBe(403);
        expect(display.delete).not.toHaveBeenCalled();
    });
});

describe("display-update event", () => {
    it("is broadcast on the display channel with the updated display after a PUT", async () => {
        display.update.mockResolvedValue({ ...dbDisplay, view: "HYBRID" });

        const res = await request(buildApp()).put(`/v1/displays/${DISPLAY_ID}`).send(validBody);

        expect(displayEvent.broadcastEvent).toHaveBeenCalledOnce();
        expect(displayEvent.broadcastEvent).toHaveBeenCalledWith(res.body, "display-update");
        expect(res.body).toMatchObject({ id: DISPLAY_ID, view: "HYBRID", stationIds: [STATION_A, STATION_B] });
    });

    it("is broadcast after a PATCH", async () => {
        display.update.mockResolvedValue({ ...dbDisplay, autoScroll: false });

        const res = await request(buildApp()).patch(`/v1/displays/${DISPLAY_ID}`).send({ autoScroll: false });

        expect(displayEvent.broadcastEvent).toHaveBeenCalledOnce();
        expect(displayEvent.broadcastEvent).toHaveBeenCalledWith(res.body, "display-update");
    });

    it("is not broadcast when the update fails", async () => {
        display.update.mockRejectedValue(prismaError("P2025"));

        await request(buildApp()).patch(`/v1/displays/${DISPLAY_ID}`).send({ autoScroll: false });

        expect(displayEvent.broadcastEvent).not.toHaveBeenCalled();
    });

    it("is not broadcast on create", async () => {
        display.create.mockResolvedValue(dbDisplay);

        await request(buildApp()).post("/v1/displays").send({ name: "Display ingresso" });

        expect(displayEvent.broadcastEvent).not.toHaveBeenCalled();
    });
});

describe("displays OpenAPI document", () => {
    const doc = generateOpenApiDocument();
    const schemas = doc.components?.schemas ?? {};

    function responseSchema(path: string, method: "get" | "post" | "put" | "patch", status: string) {
        const operation = (doc.paths?.[path] as Record<string, any>)[method];
        const schema = operation.responses[status].content["application/json"].schema;
        const ref = schema.$ref ?? schema.items?.$ref;
        return schemas[ref.split("/").pop()] as Record<string, any>;
    }

    it.each([
        ["/v1/displays", "post", "201"],
        ["/v1/displays/{id}", "put", "200"],
        ["/v1/displays/{id}", "patch", "200"],
    ] as const)("%s %s documents only stationIds, without stations", (path, method, status) => {
        const properties = responseSchema(path, method, status).properties;
        expect(properties).toHaveProperty("stationIds");
        expect(properties).not.toHaveProperty("stations");
    });

    it.each([
        ["/v1/displays", "get"],
        ["/v1/displays/{id}", "get"],
    ] as const)("%s %s documents the included stations without categories", (path, method) => {
        expect(responseSchema(path, method, "200").properties).toHaveProperty("stations");
        expect((schemas.DisplayStation as Record<string, any>).properties).not.toHaveProperty("categories");
    });
});
