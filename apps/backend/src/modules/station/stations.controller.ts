import { Response } from "express";

import { asyncHandler } from "@/utils/asyncHandler";
import { StationsService } from "./stations.service";

import { CUIDParam, StationInput, StationResponse, GetStationQuery } from "@mysagra/schemas";
import { TypedRequest } from "@/types/request";
import { NotFoundError } from "@/common/errors";

export class StationsController {
    constructor(private stationService: StationsService) { }

    getStations = asyncHandler(async (
        req: TypedRequest<{ query: GetStationQuery }>,
        res: Response,
    ): Promise<void> => {
        const stations = await this.stationService.getStations(req.validated.query)

        if(!stations) throw new NotFoundError("No stations found");
        res.status(200).json(stations);
    });

    getStationById = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam, query: GetStationQuery }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        const station = await this.stationService.getStationById(id, req.validated.query)

        if(!station) throw new NotFoundError("Station not found");
        res.status(200).json(station);
    })

    createStation = asyncHandler(async (
        req: TypedRequest<{ body: StationInput }>,
        res: Response,
    ): Promise<void> => {
        const station = await this.stationService.createStation(req.validated.body);
        res.status(201).json(station);
    });

    updateStation = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam, body: StationInput }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        const station = await this.stationService.updateStation(id, req.validated.body)
        res.status(200).json(station);
    });

    deleteStation = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        await this.stationService.deleteStation(id);
        res.status(204).send();
    });
}