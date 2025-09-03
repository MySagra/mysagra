import prisma from "@/utils/prisma";

export default async function generateOrderId(): Promise<string> {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";
    do {
        for (let i = 0; i < 3; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }while(await prisma.order.findUnique({
        where: {
            id
        }
    }));
    
    return id;
}