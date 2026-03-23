import { render, screen } from "@testing-library/react";
import SignInPage from "@/app/auth/sign-in/page";
import SignUpPage from "@/app/auth/sign-up/page";

// Mock next-auth/react signIn (used by sign-in form)
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

// Mock the sign-up server action
jest.mock("@/app/auth/sign-up/actions", () => ({
  signUpAction: jest.fn(),
}));

describe("SignInPage", () => {
  it("renders email input", () => {
    render(<SignInPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("renders password input", () => {
    render(<SignInPage />);
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders sign in submit button", () => {
    render(<SignInPage />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders Continue with Google button", () => {
    render(<SignInPage />);
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
  });

  it("renders link to sign up page", () => {
    render(<SignInPage />);
    expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
  });
});

describe("SignUpPage", () => {
  it("renders name input", () => {
    render(<SignUpPage />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it("renders email input", () => {
    render(<SignUpPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("renders password input", () => {
    render(<SignUpPage />);
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders create account button", () => {
    render(<SignUpPage />);
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("renders Continue with Google button", () => {
    render(<SignUpPage />);
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
  });
});
