import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Toast from "./Toast";
import Loader from "./Loader";
import ErrorBoundary from "./ErrorBoundary";
import PageHeading from "./PageHeading";
import en from "../translations/en";
import de from "../translations/de";
import ua from "../translations/ua";

const { state, dispatchMock, resetErrorMock, resetSuccessMock } = vi.hoisted(() => ({
    state: { profile: { language: "en" }, error: false, success: false, errorText: "Request failed", successText: "Changes saved" },
    dispatchMock: vi.fn(),
    resetErrorMock: vi.fn(() => ({ type: "test/resetError" })),
    resetSuccessMock: vi.fn(() => ({ type: "test/resetSuccess" })),
}));

vi.mock("react-redux", () => ({
    useDispatch: () => dispatchMock,
    useSelector: (selector: (value: typeof state) => unknown) => selector(state),
}));

vi.mock("../redux/store", () => ({
    user: (value: typeof state) => value.profile,
    isError: (value: typeof state) => value.error,
    isSuccess: (value: typeof state) => value.success,
    errorMessage: (value: typeof state) => value.errorText,
    successMessage: (value: typeof state) => value.successText,
}));

vi.mock("../redux/slice", () => ({
    resetError: resetErrorMock,
    resetSuccess: resetSuccessMock,
}));

beforeEach(() => {
    vi.clearAllMocks();
    state.profile.language = "en";
    state.error = false;
    state.success = false;
    state.errorText = "Request failed";
    state.successText = "Changes saved";
});

afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
});

function expectFeedbackCleared() {
    expect(dispatchMock.mock.calls.map(([action]) => action)).toEqual([{ type: "test/resetError" }, { type: "test/resetSuccess" }]);
}

describe("feedback notifications", () => {
    it("does not announce a notification when there is no result to show", () => {
        render(<Toast />);

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(dispatchMock).not.toHaveBeenCalled();
    });

    it("announces successful feedback", () => {
        state.success = true;
        render(<Toast />);

        expect(screen.getByRole("alert")).toHaveTextContent(state.successText);
        expect(screen.queryByText(state.errorText)).not.toBeInTheDocument();
    });

    it("prioritizes a failure when error and success state coexist", () => {
        state.success = true;
        state.error = true;
        render(<Toast />);

        expect(screen.getByRole("alert")).toHaveTextContent(state.errorText);
        expect(screen.queryByText(state.successText)).not.toBeInTheDocument();
    });

    it("clears both feedback states through the localized close action", async () => {
        state.error = true;
        state.profile.language = "de";
        const interaction = userEvent.setup();
        render(<Toast />);

        await interaction.click(screen.getByRole("button", { name: de.CLOSE }));

        expectFeedbackCleared();
    });

    it("keeps feedback available for six seconds before clearing it", () => {
        vi.useFakeTimers();
        state.success = true;
        render(<Toast />);

        act(() => {
            vi.advanceTimersByTime(5999);
        });
        expect(dispatchMock).not.toHaveBeenCalled();
        act(() => {
            vi.advanceTimersByTime(1);
        });

        expectFeedbackCleared();
    });

    it("does not dismiss feedback when the user clicks outside it", () => {
        vi.useFakeTimers();
        state.success = true;
        render(
            <>
                <Toast />
                <button type="button">Outside notification</button>
            </>
        );
        act(() => {
            vi.advanceTimersByTime(1);
        });

        fireEvent.click(screen.getByRole("button", { name: "Outside notification" }));

        expect(dispatchMock).not.toHaveBeenCalled();
        expect(screen.getByRole("alert")).toHaveTextContent(state.successText);
    });

    it("allows keyboard dismissal with Escape", () => {
        state.success = true;
        render(<Toast />);

        fireEvent.keyDown(document, { key: "Escape" });

        expectFeedbackCleared();
    });
});

describe("loading status", () => {
    it.each([
        { language: "en", labels: en },
        { language: "de", labels: de },
        { language: "ua", labels: ua },
    ])("exposes a localized live status while loading in $language", ({ language, labels }) => {
        state.profile.language = language;
        render(<Loader />);

        const status = screen.getByRole("status");
        expect(status).toHaveTextContent(labels.LOADING);
        expect(status).toHaveAttribute("aria-live", "polite");
        expect(within(status).getByRole("progressbar")).toBeInTheDocument();
    });
});

describe("error recovery", () => {
    it("renders healthy child content without an error fallback", () => {
        render(
            <ErrorBoundary errorMessage="Something went wrong" buttonText="Reload">
                <p>Your workspace is ready</p>
            </ErrorBoundary>
        );

        expect(screen.getByText("Your workspace is ready")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Reload" })).not.toBeInTheDocument();
    });

    it("contains a rendering failure, reports it and presents an accessible recovery action", () => {
        const failure = new Error("A child failed during rendering");
        const report = vi.spyOn(console, "error").mockImplementation(() => undefined);
        function BrokenChild(): never {
            throw failure;
        }

        render(
            <ErrorBoundary errorMessage={ua.ERROR_BOUNDARY_MESSAGE} buttonText={ua.RELOAD}>
                <BrokenChild />
            </ErrorBoundary>
        );

        expect(screen.getByRole("heading", { level: 1, name: ua.ERROR_BOUNDARY_MESSAGE })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: ua.RELOAD })).toBeEnabled();
        expect(report).toHaveBeenCalledWith(failure, expect.objectContaining({ componentStack: expect.any(String) }));
    });
});

describe("page headings", () => {
    it("preserves a semantic page title and an interactive optional action", async () => {
        const onAction = vi.fn();
        const interaction = userEvent.setup();
        render(
            <PageHeading
                eyebrow="Your workspace"
                title="Saved keys"
                description="Return to your favorite practice keys."
                action={
                    <button type="button" onClick={onAction}>
                        Find a key
                    </button>
                }
            />
        );

        expect(screen.getByRole("heading", { level: 1, name: "Saved keys" })).toBeInTheDocument();
        expect(screen.getByText("Your workspace")).toBeInTheDocument();
        expect(screen.getByText("Return to your favorite practice keys.")).toBeInTheDocument();
        await interaction.click(screen.getByRole("button", { name: "Find a key" }));
        expect(onAction).toHaveBeenCalledOnce();
    });

    it("supports a title without an unnecessary action or supporting copy", () => {
        render(<PageHeading title="Your profile" />);

        expect(screen.getByRole("heading", { level: 1, name: "Your profile" })).toBeInTheDocument();
        expect(screen.getAllByRole("heading")).toHaveLength(1);
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
});
