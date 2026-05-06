import { Router } from "express";
import "./stations.docs";

import { authenticate } from "@/middlewares/authenticate";
import { validateRequest } from "@/middlewares/validateRequest";
import { cuidParamSchema, GetStationQuerySchema, StationInputSchema} from "@mysagra/schemas";

import { StationsService } from "./stations.service";
import { StationsController } from "./stations.controller";

const stationController = new StationsController(new StationsService());
const router = Router();


router.get(
    "/",
    authenticate(["admin", "maintainer"]),
    validateRequest({
        query: GetStationQuerySchema
    }),
    stationController.getStations
);

router.get(
    "/:id",
    authenticate(["admin", "maintainer"]),
    validateRequest({
        query: GetStationQuerySchema,
        params: cuidParamSchema
    }),
    stationController.getStationById
);

router.post(
    "/",
    authenticate(["admin"]),
    validateRequest({
        body: StationInputSchema
    }),
    stationController.createStation
);

router.put(
    "/:id",
    authenticate(["admin", "maintainer"]),
    validateRequest({
        body: StationInputSchema,
        params: cuidParamSchema
    }),
    stationController.updateStation
);


router.delete(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema
    }),
    stationController.deleteStation
);

export default router;