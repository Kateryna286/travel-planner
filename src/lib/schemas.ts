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
      address: z.string().optional(),
    }),
    group: z.object({
      adults: z.number().int().min(1, "At least 1 adult required").max(20),
      children: z.number().int().min(0).max(20),
      type: z.enum(["Family", "Friends", "Solo", "Couple", "Business"]),
    }).refine(
      (g) => g.type !== "Friends" || g.adults >= 2,
      { message: "Friend groups need at least 2 adults", path: ["adults"] }
    ),
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
    transportMode: z.enum(["car", "publicTransport"]),
  })
  .refine((data) => data.returnDate > data.departureDate, {
    message: "Return date must be after departure date",
    path: ["returnDate"],
  })
  .refine(
    (data) =>
      !data.accommodation.booked ||
      (!!data.accommodation.address && data.accommodation.address.trim().length >= 5),
    {
      message: "Please enter your accommodation address (at least 5 characters)",
      path: ["accommodation", "address"],
    }
  );

export type TravelFormValues = z.infer<typeof TravelFormSchema>;
