import { prisma } from "@mysagra/database";
import { CreateOrderInstruction, UpdateOrderInstruction } from "@mysagra/schemas"

export class OrderInstructionsService {
    async getOrderInstructions() {
        return await prisma.orderInstruction.findMany({
            orderBy: {
                position: 'asc'
            }
        });
    }

    async getOrderInstruction(id: string) {
        return await prisma.orderInstruction.findUnique({
            where: {
                id
            }
        });
    }

    async createOrderInstruction(orderInstruction: CreateOrderInstruction) {
        let position = orderInstruction.position;
        if (position === undefined) {
            const maxPosition = await prisma.orderInstruction.aggregate({
                _max: { position: true }
            });
            position = (maxPosition._max.position ?? 0) + 1;
        }

        return await prisma.orderInstruction.create({
            data: {
                text: orderInstruction.text,
                position
            }
        })
    }

    async updateOrderInstruction(id: string, orderInstruction: UpdateOrderInstruction) {
        return await prisma.orderInstruction.update({
            where: {
                id
            },
            data: orderInstruction
        })
    }

    async deleteOrderInstruction(id: string){
        return await prisma.orderInstruction.delete({
            where: {
                id
            }
        })
    }
}