import { prisma } from "@mysagra/database"
import { BannerInput } from "@mysagra/schemas";
import { ImagesService } from "../images/images.service";

export class BannerService {
    public static imageService = new ImagesService('banners', 'banner');

    async getBanners() {
        return await prisma.banner.findMany();
    }

    async getBanner(id: string) {
        return await prisma.banner.findUnique({
            where: {
                id
            }
        })
    }

    async createBanner(banner: BannerInput) {
        return await prisma.banner.create({
            data: {
                ...banner
            }
        })
    }

    async updateBanner(id: string, banner: BannerInput) {
        return await prisma.banner.update({
            where: {
                id
            },
            data: {
                ...banner
            }
        })
    }

    async deleteBanner(id: string) {
        return await prisma.banner.delete({
            where: {
                id
            }
        })
    }

    async uploadImage(id: string, file: Express.Multer.File) {
        return await prisma.$transaction(async (tx) => {
            const banner = await prisma.banner.findUnique({
                where: {
                    id
                }
            })

            if (banner?.image && (banner.image !== file.filename)) {
                BannerService.imageService.delete(banner.image)
            }

            return await prisma.banner.update({
                where: {
                    id
                },
                data: {
                    image: file.filename
                }
            })
        })
    }
}