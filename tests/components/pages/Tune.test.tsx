import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Tune from "../../../src/components/pages/Tune";
import en from "../../../src/translations/en";

vi.mock("react-redux", () => ({
    useSelector: (selector: (state: { language: string }) => unknown) => selector({ language: "en" }),
}));

vi.mock("../../../src/redux/store", () => ({
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

it("plays the real reference asset and resets playback when the user stops it", async () => {
    const interaction = userEvent.setup();
    const view = render(<Tune />);
    const audio = view.container.querySelector("audio")!;

    expect(audio).toHaveAttribute("src", expect.stringContaining("fork_sound.mp3"));
    expect(screen.getByText(en.AUDIO_READY)).toBeInTheDocument();
    await interaction.click(screen.getByRole("button", { name: en.PLAY }));
    await waitFor(() => expect(screen.getByRole("button", { name: en.STOP })).toHaveAttribute("aria-busy", "false"));
    expect(screen.getByText(en.AUDIO_PLAYING)).toBeInTheDocument();
    expect(audio.play).toHaveBeenCalledOnce();

    audio.currentTime = 2;
    await interaction.click(screen.getByRole("button", { name: en.STOP }));
    expect(audio.pause).toHaveBeenCalledOnce();
    expect(audio.currentTime).toBe(0);
    expect(screen.getByRole("button", { name: en.PLAY })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(en.AUDIO_READY)).toBeInTheDocument();
});

it("updates the media volume through keyboard-accessible slider controls", async () => {
    const interaction = userEvent.setup();
    const view = render(<Tune />);
    const audio = view.container.querySelector("audio")!;
    const slider = screen.getByRole("slider", { name: en.VOLUME });

    expect(audio.volume).toBeCloseTo(0.3);
    act(() => slider.focus());
    await interaction.keyboard("{ArrowRight}");
    expect(slider).toHaveValue("31");
    expect(audio.volume).toBeCloseTo(0.31);
    expect(screen.getByText("31%")).toBeInTheDocument();

    await interaction.keyboard("{Home}");
    expect(slider).toHaveValue("0");
    expect(audio.volume).toBe(0);
    await interaction.keyboard("{End}");
    expect(slider).toHaveValue("100");
    expect(audio.volume).toBe(1);
});

it("recovers from a playback failure when the user retries", async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new Error("Audio unavailable"));
    const interaction = userEvent.setup();
    render(<Tune />);
    await interaction.click(screen.getByRole("button", { name: en.PLAY }));

    expect(await screen.findByRole("alert")).toHaveTextContent(en.PLAYBACK_ERROR);
    expect(screen.getByRole("button", { name: en.PLAY })).toBeEnabled();
    await interaction.click(screen.getByRole("button", { name: en.PLAY }));
    await waitFor(() => expect(screen.getByText(en.AUDIO_PLAYING)).toBeInTheDocument());

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.STOP })).toHaveAttribute("aria-pressed", "true");
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
});

it("returns to the ready state when the reference recording ends", async () => {
    const interaction = userEvent.setup();
    const view = render(<Tune />);
    await interaction.click(screen.getByRole("button", { name: en.PLAY }));
    await waitFor(() => expect(screen.getByText(en.AUDIO_PLAYING)).toBeInTheDocument());
    fireEvent.ended(view.container.querySelector("audio")!);

    expect(screen.getByRole("button", { name: en.PLAY })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(en.AUDIO_READY)).toBeInTheDocument();
});

it("pauses the reference recording when the user leaves the page", async () => {
    const interaction = userEvent.setup();
    const view = render(<Tune />);
    await interaction.click(screen.getByRole("button", { name: en.PLAY }));
    await waitFor(() => expect(screen.getByText(en.AUDIO_PLAYING)).toBeInTheDocument());
    vi.mocked(HTMLMediaElement.prototype.pause).mockClear();
    view.unmount();

    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledOnce();
});
