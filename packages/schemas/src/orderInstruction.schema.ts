import { z } from "zod"

const OrderInstructionBaseSchema = z.object({
    text: z.string().meta({
        description: "The instruction text to be displayed to customers. Contains special preparation or serving instructions for the order.",
        example: "Cook pasta al dente, add fresh basil before serving"
    }),
    position: z.number().int().optional().meta({
        description: "Display order position for the instruction. Lower numbers appear first. Optional - if omitted during creation, will be automatically assigned as the next available position.",
        example: 1
    })
})

export const CreateOrderInstructionSchema = OrderInstructionBaseSchema

export const UpdateOrderInstructionSchema = OrderInstructionBaseSchema.extend({
    text: z.string().meta({
        description: "The instruction text to be displayed to customers. Contains special preparation or serving instructions for the order.",
        example: "Cook pasta al dente, add fresh basil before serving"
    }),
    position: z.number().int().meta({
        description: "Display order position for the instruction. Lower numbers appear first. Required when updating an instruction.",
        example: 1
    })
})

export const OrderInstructionResponseSchema = OrderInstructionBaseSchema.extend({
    id: z.cuid().meta({
        description: "Unique identifier for the order instruction",
        example: "clxyz1234abcd5678efgh9012"
    }),
    position: z.number().meta({
        description: "Display order position for the instruction. Lower numbers appear first.",
        example: 1
    })
})

export type CreateOrderInstruction = z.infer<typeof CreateOrderInstructionSchema>
export type UpdateOrderInstruction = z.infer<typeof UpdateOrderInstructionSchema>
export type OrderInstructionResponseSchema = z.infer<typeof OrderInstructionResponseSchema>