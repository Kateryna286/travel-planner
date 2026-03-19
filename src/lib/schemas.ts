import { z } from "zod";

const today = new Date().toISOString().split("T")[0];

export const TravelFormSchema = z
  .object({
    destination: z.string().min(2, "Enter a destination").max(100),
    departureDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
      .refine((d) => d >= today, "Departure must be today or later"),
    returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
    accommodation: z.object({
      booked: z.boolean(),
      preferences: z
        .array(z.enum(["Hotel", "Airbnb", "Hostel", "Resort", "BedAndBreakfast"]))
        .optional(),
    }),
    group: z.object({
      adults: z.number().int().min(1, "At least 1 adult required").max(20),
      children: z.number().int().min(0).max(20),
      type: z.enum(["Family", "Friends", "Solo", "Couple", "Business"]),
    }),
    preferences: z
      .array(
        z.enum([
          "Nature",
          "Architecture",
          "Entertainment",
          "Food",
          "Adventure",
          "Art",
          "Shopping",
          "Wellness",
          "LocalExperiences",
        ])
      )
      .min(1, "Select at least one preference"),
  })
  .refine((data) => data.returnDate > data.departureDate, {
    message: "Return date must be after departure date",
    path: ["returnDate"],
  });

export type TravelFormValues = z.infer<typeof TravelFormSchema>;
