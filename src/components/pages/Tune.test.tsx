import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Tune from "./Tune";
import en from "../../translations/en";

vi.mock("react-redux", () => ({
    useSelector: (selector: (state: { language: string }) => unknown) => selector({ language: "en" }),
}));

vi.mock("../../redux/store", () => ({
    user: (state: { language: string }) => state,
}));

beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

it("allows stopping a loading reference tone and ignores its interrupted playback promise", async () => {
    let rejectPlayback!: (error: Error) => void;
    vi.mocked(HTMLMediaElement.prototype.play).mockImplementationOnce(
        () =>
            new Promise((_resolve, reject) => {
                rejectPlayback = reject;
            })
    );
    const interaction = userEvent.setup();
    render(<Tune />);
    await interaction.click(screen.getByRole("button", { name: en.PLAY }));

    const stop = screen.getByRole("button", { name: en.STOP });
    expect(stop).toHaveAttribute("aria-busy", "true");
    await interaction.click(stop);
    await act(async () => {
        rejectPlayback(new Error("Playback was interrupted"));
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.PLAY })).toHaveAttribute("aria-pressed", "false");
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
    expect(screen.getByRole("slider", { name: en.VOLUME })).toHaveValue("30");
});
