import prisma from "@/utils/prisma";
import { OrderItem } from "@/schemas";
import { Prisma } from "@generated/prisma_client";

export class OrderItemService {
    async getOrderItemById(id: string) {
        return await prisma.orderItem.findUnique({
            where: {
                id
            },
            include: {
                food: true
            }
        })
    }

    async getOrderItemsByOrderId(orderId: number, tx?: Prisma.TransactionClient) {
        const client = tx || prisma;
        return await client.orderItem.findMany({
            where: {
                orderId
            },
            include: {
                food: true
            }
        })
    }

    async createOrderItem(item: OrderItem, orderId: number) {
        return await prisma.orderItem.create({
            data: {
                orderId,
                foodId: item.foodId,
                quantity: item.quantity,
                notes: item.notes,
                unitPrice: item.unitPrice!,
                unitSurcharge: item.surcharge / item.quantity,
                total: item.total!,
            }
        })
    }

    async createManyOrderItem(
        items: OrderItem[], 
        orderId: number,
        tx?: Prisma.TransactionClient
    ) {
        const client = tx || prisma;

        await client.orderItem.createMany({
            data: items.map(item => ({
                orderId,
                foodId: item.foodId,
                quantity: item.quantity,
                notes: item.notes,
                unitPrice: item.unitPrice!,
                unitSurcharge: item.surcharge / item.quantity,
                total: item.total!,
            })),
        });

        return await client.orderItem.findMany({
            where: {
                orderId
            },
            include: {
                food: true
            }
        });
    }

    async updateNotes(id: string, notes: string) {
        return await prisma.orderItem.update({
            where: {
                id
            },
            data: {
                notes
            }
        })
    }

    async deleteItemsFromOrder(orderId: number, tx?: Prisma.TransactionClient) {
        const client = tx || prisma;
        return await client.orderItem.deleteMany({
            where: {
                orderId
            }
        })
    }
}