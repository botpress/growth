import { z, ZodObject, ZodRawShape, ZodTypeAny } from "@botpress/sdk";

export const getSearchOutputSchema = (result: ZodObject<ZodRawShape>) => {
  return z
    .object({
      success: z.boolean(),
      error: z.string().optional(),
      records: z.array(result).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.success && data.records === undefined) {
        ctx.addIssue({
          code: "custom",
          message: "records must be provided if success is true",
          path: ["records"],
        });
      }

      if (!data.success && data.error === undefined) {
        ctx.addIssue({
          code: "custom",
          message: "error must be provided if success is false",
          path: ["error"],
        });
      }
    });
};
