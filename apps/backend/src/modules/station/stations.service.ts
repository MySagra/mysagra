import { prisma } from "@mysagra/database";
import { StationInput, StationResponse, GetStationQuery } from "@mysagra/schemas";
import { NotFoundError } from "@/common/errors";

export class StationsService {
    private inclusions = {
        'categories': {
            categories: true
        },
        'categories.foods': {
            categories: { include: { foods: true } }
        },
        'categories.foods.ingredients': {
            categories: {
                include: {
                    foods: { include: { foodIngredients: true } }
                }
            }
        }
    };


    async getStations(query: GetStationQuery) {
        const { include } = query

        const includeClause = include ? this.inclusions[include] : undefined;

        return await prisma.station.findMany({
            include: includeClause
        });
    }

    async getStationById(id: string, query: GetStationQuery) {
        const { include } = query

        const includeClause = include ? this.inclusions[include] : undefined;

        const user = await prisma.station.findUnique({
            where: {
                id
            },
            include: includeClause
        });

        if (!user) {
            throw new NotFoundError("User not found");
        }

        return user;
    }

    async createStation(station: StationInput) {
        return await prisma.station.create({
            data: station
        })
    }

    async updateStation(id: string, station: StationInput) {
        return await prisma.station.update({
            where: {
                id
            },
            data: station
        })
    }

    async deleteStation(id: string) {
        return await prisma.station.delete({
            where: {
                id
            }
        });
    }
}