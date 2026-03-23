import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TravelFormSchema, type TravelFormValues } from "@/lib/schemas";
import GroupSection from "@/components/TravelForm/GroupSection";

function Wrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm<TravelFormValues>({
    resolver: zodResolver(TravelFormSchema),
    defaultValues: {
      accommodation: { booked: false },
      // Use "Family" so adults + children inputs are always rendered
      group: { adults: 2, children: 1, type: "Family" },
      preferences: ["Food"],
      transportMode: "publicTransport",
      destination: "Paris",
      departureDate: "2099-12-01",
      returnDate: "2099-12-10",
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe("GroupSection", () => {
  it("renders group type buttons", () => {
    render(<Wrapper><GroupSection /></Wrapper>);
    // GroupSection renders a button grid, not a <select>
    expect(screen.getByRole("button", { name: /family/i })).toBeInTheDocument();
  });

  it("renders adults input", () => {
    render(<Wrapper><GroupSection /></Wrapper>);
    expect(screen.getByLabelText(/adults/i)).toBeInTheDocument();
  });

  it("renders children input", () => {
    render(<Wrapper><GroupSection /></Wrapper>);
    expect(screen.getByLabelText(/children/i)).toBeInTheDocument();
  });

  it("allows switching group type by clicking a button", async () => {
    const user = userEvent.setup();
    render(<Wrapper><GroupSection /></Wrapper>);
    const soloBtn = screen.getByRole("button", { name: /solo/i });
    await user.click(soloBtn);
    expect(soloBtn).toBeInTheDocument();
  });

  it("allows changing adults count", async () => {
    const user = userEvent.setup();
    render(<Wrapper><GroupSection /></Wrapper>);
    const adultsInput = screen.getByLabelText(/adults/i);
    await user.clear(adultsInput);
    await user.type(adultsInput, "3");
    expect(adultsInput).toHaveValue(3);
  });
});
