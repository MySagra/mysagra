import { Router } from "express";
import type { ApiModule } from "./module";

/**
 * Mounts a list of API modules onto a single Express router.
 * Each module is mounted at its `basePath`, optionally guarded by its own limiter.
 */
export function registerModules(modules: ApiModule[]): Router {
    const router = Router();

    for (const mod of modules) {
        const middlewares = mod.limiter ? [mod.limiter] : [];
        router.use(mod.basePath, ...middlewares, mod.router);
    }

    return router;
}
