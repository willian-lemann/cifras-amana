// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeedbackWidget } from "@/components/feedback-widget";
import posthog from "posthog-js";

// ---- posthog mock ----

vi.mock("posthog-js", () => ({
  default: { capture: vi.fn() },
}));

// ---- next/navigation mock ----

const mockReplace = vi.fn();
let mockSearchParamsString = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(mockSearchParamsString),
}));

// ---- auth-client mock ----

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "test-user" } } }),
}));

// ---- helpers ----

function withFeedbackOpen() {
  mockSearchParamsString = "feedback=1";
}

function withFeedbackClosed() {
  mockSearchParamsString = "";
}

// ---- tests ----

describe("FeedbackWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withFeedbackClosed();
    sessionStorage.clear();
  });

  it("renders the floating trigger button", () => {
    render(<FeedbackWidget />);
    expect(
      screen.getByRole("button", { name: /abrir feedback/i }),
    ).toBeDefined();
  });

  it("clicking the trigger adds ?feedback=1 to the URL", async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    await user.click(screen.getByRole("button", { name: /abrir feedback/i }));

    expect(mockReplace).toHaveBeenCalledWith("/dashboard?feedback=1");
  });

  it("shows the dialog content when URL has ?feedback=1", () => {
    withFeedbackOpen();
    render(<FeedbackWidget />);

    expect(screen.getByText(/como você avalia a plataforma/i)).toBeDefined();
  });

  it("renders five star buttons when dialog is open", () => {
    withFeedbackOpen();
    render(<FeedbackWidget />);

    const starButtons = screen.getAllByRole("button", { name: /estrela/i });
    expect(starButtons).toHaveLength(5);
  });

  it("shows rating label after selecting a star", async () => {
    withFeedbackOpen();
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    await user.click(screen.getByRole("button", { name: "5 estrelas" }));

    expect(screen.getByText("Excelente")).toBeDefined();
  });

  it("submit button is disabled when no star is selected", () => {
    withFeedbackOpen();
    render(<FeedbackWidget />);

    const submitBtn = screen.getByRole("button", { name: /enviar feedback/i });
    expect(submitBtn.hasAttribute("disabled")).toBe(true);
  });

  it("submit button is enabled after selecting a star", async () => {
    withFeedbackOpen();
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    await user.click(screen.getByRole("button", { name: "3 estrelas" }));

    const submitBtn = screen.getByRole("button", { name: /enviar feedback/i });
    expect(submitBtn.hasAttribute("disabled")).toBe(false);
  });

  it("tracks feedback event on submit with rating and text", async () => {
    withFeedbackOpen();

    const user = userEvent.setup();
    render(<FeedbackWidget />);

    await user.click(screen.getByRole("button", { name: "4 estrelas" }));
    await user.type(
      screen.getByPlaceholderText(/o que você achou/i),
      "Ótima plataforma",
    );
    await user.click(screen.getByRole("button", { name: /enviar feedback/i }));

    expect(posthog.capture).toHaveBeenCalledWith("feedback", {
      rating: 4,
      text: "Ótima plataforma",
    });
  });

  it("shows success state after submit", async () => {
    withFeedbackOpen();
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    await user.click(screen.getByRole("button", { name: "5 estrelas" }));
    await user.click(screen.getByRole("button", { name: /enviar feedback/i }));

    expect(screen.getByText(/obrigado pelo feedback/i)).toBeDefined();
  });

  it("does not pass text to analytics when textarea is empty", async () => {
    withFeedbackOpen();

    const user = userEvent.setup();
    render(<FeedbackWidget />);

    await user.click(screen.getByRole("button", { name: "2 estrelas" }));
    await user.click(screen.getByRole("button", { name: /enviar feedback/i }));

    expect(posthog.capture).toHaveBeenCalledWith("feedback", {
      rating: 2,
      text: undefined,
    });
  });

  it("closing the dialog removes ?feedback from the URL", async () => {
    withFeedbackOpen();
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    // Click the close button (X)
    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });

  it("auto-opens after interval by setting ?feedback=1", () => {
    vi.useFakeTimers();
    render(<FeedbackWidget />);

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(mockReplace).toHaveBeenCalledWith("/dashboard?feedback=1");

    vi.useRealTimers();
  });

  it("sets closed_feedback in sessionStorage when dialog is closed without submitting", async () => {
    withFeedbackOpen();
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(sessionStorage.getItem("closed_feedback")).toBe("1");
  });

  it("auto-open interval does NOT open widget when closed_feedback is in sessionStorage", () => {
    vi.useFakeTimers();
    sessionStorage.setItem("closed_feedback", "1");
    render(<FeedbackWidget />);

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(mockReplace).not.toHaveBeenCalledWith("/dashboard?feedback=1");

    vi.useRealTimers();
  });

  it("auto-open interval fires multiple times but never opens when closed_feedback is set", () => {
    vi.useFakeTimers();
    sessionStorage.setItem("closed_feedback", "1");
    render(<FeedbackWidget />);

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000 * 3);
    });

    expect(mockReplace).not.toHaveBeenCalledWith("/dashboard?feedback=1");

    vi.useRealTimers();
  });

  it("sets closed_feedback in sessionStorage even after submitting feedback and clicking close", async () => {
    withFeedbackOpen();
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    await user.click(screen.getByRole("button", { name: "5 estrelas" }));
    await user.click(screen.getByRole("button", { name: /enviar feedback/i }));
    await user.click(screen.getByRole("button", { name: /fechar/i }));

    expect(sessionStorage.getItem("closed_feedback")).toBe("1");
  });
});
