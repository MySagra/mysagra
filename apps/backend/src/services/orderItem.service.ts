import prisma from "@/utils/prisma";
import { OrderItem } from "@/schemas";

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

    async getOrderItemsByOrderId(orderId: number) {
        return await prisma.orderItem.findMany({
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
                ...item
            }
        })
    }

    async createManyOrderItem(items: OrderItem[], orderId: number) {
        return await prisma.orderItem.createMany({
            data: items.map(item => ({
                orderId,
                foodId: item.foodId,
                quantity: item.quantity,
                notes: item.notes
            }))
        })
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
}