import { TypedRequest } from "@/types/request";
import { Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { BannerService } from "./banner.service";
import { BannerInput, CUIDParam } from "@mysagra/schemas";
import { BadRequestError } from "@/common/errors";

export class BannerController {
    constructor(private bannerService: BannerService) { }

    getBanners = asyncHandler(async (
        _req: TypedRequest<{}>,
        res: Response
    ): Promise<void> => {
        const banners = await this.bannerService.getBanners()
        res.status(200).json(banners)
    })

    getBanner = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam }>,
        res: Response
    ): Promise<void> => {
        const { id } = req.validated.params
        const banner = await this.bannerService.getBanner(id);
        res.status(200).json(banner)
    })

    createBanner = asyncHandler(async (
        req: TypedRequest<{ body: BannerInput }>,
        res: Response
    ): Promise<void> => {
        const banner = await this.bannerService.createBanner(req.validated.body)
        res.status(201).json(banner)
    })

    updateBanner = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam, body: BannerInput }>,
        res: Response
    ): Promise<void> => {
        const { id } = req.validated.params
        const banner = await this.bannerService.updateBanner(id, req.validated.body)
        res.status(201).json(banner)
    })

    uploadImage = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        const file = req.file

        if (!file) {
            throw new BadRequestError("No file provided for upload");
        }

        const category = await this.bannerService.uploadImage(id, file);
        res.status(200).json(category);
    });

    deleteBanner = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam }>,
        res: Response
    ): Promise<void> => {
        const { id } = req.validated.params

        const banner = await this.bannerService.deleteBanner(id);
        res.status(200).json(banner)
    })
}