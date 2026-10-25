import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Tonality from "../../../src/components/pages/Tonality";
import en from "../../../src/translations/en";

const { dispatchMock, setPresetsMock, decodeBase64Mock } = vi.hoisted(() => ({
    dispatchMock: vi.fn(),
    setPresetsMock: vi.fn((payload: unknown) => ({ type: "test/savePreset", payload })),
    decodeBase64Mock: vi.fn(() => "verified-user-id"),
}));

vi.mock("react-redux", () => ({
    useDispatch: () => dispatchMock,
    useSelector: (selector: (state: { user: { language: string }; isLoading: boolean }) => unknown) => selector({ user: { language: "en" }, isLoading: false }),
}));

vi.mock("../../../src/redux/store", () => ({
    user: (state: { user: { language: string } }) => state.user,
    isLoading: (state: { isLoading: boolean }) => state.isLoading,
}));

vi.mock("../../../src/redux/thunks", () => ({
    setPresets: setPresetsMock,
    decodeBase64: decodeBase64Mock,
}));

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 200,
        bottom: 48,
        width: 200,
        height: 48,
        toJSON: () => ({}),
    });
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

function renderPage() {
    const interaction = userEvent.setup();
    render(<Tonality />);
    return interaction;
}

async function chooseCount(interaction: ReturnType<typeof userEvent.setup>, count: number) {
    await interaction.click(screen.getByRole("combobox", { name: en.SELECT_COUNT_OF_ALTERATION }));
    await interaction.click(await screen.findByRole("option", { name: new RegExp(`^${count} · `) }));
}

function resultRegion() {
    return screen.getByRole("region", { name: en.RESULT_LABEL });
}

describe("key finder", () => {
    it("requires a complete signature before calculation and keeps playback unavailable before a result", async () => {
        const interaction = renderPage();
        const findKey = screen.getByRole("button", { name: en.DETERMINE });
        const play = within(resultRegion()).getByRole("button", { name: en.PLAY });

        expect(within(resultRegion()).getByText(en.RESULT_EMPTY_TITLE)).toBeInTheDocument();
        expect(findKey).toBeDisabled();
        expect(play).toBeDisabled();
        expect(screen.getByRole("button", { name: en.FLATS })).toBeDisabled();
        expect(screen.getByRole("button", { name: en.SHARPS })).toBeDisabled();

        await chooseCount(interaction, 2);
        expect(findKey).toBeDisabled();

        const flats = screen.getByRole("button", { name: en.FLATS });
        await interaction.click(flats);
        expect(findKey).toBeEnabled();
        expect(play).toBeDisabled();
        expect(within(resultRegion()).getByText(en.RESULT_EMPTY_TITLE)).toBeInTheDocument();

        await interaction.click(flats);
        expect(findKey).toBeDisabled();

        const major = screen.getByRole("button", { name: en.MAJOR });
        await interaction.click(major);
        expect(major).toHaveAttribute("aria-pressed", "true");
    });

    it.each([
        { count: 0, accidental: null, mode: "major", expected: "C", audioFile: "C.mp3" },
        { count: 0, accidental: null, mode: "minor", expected: "Am", audioFile: "Am.mp3" },
        { count: 1, accidental: "sharp", mode: "major", expected: "G", audioFile: "G.mp3" },
        { count: 2, accidental: "flat", mode: "major", expected: "Bb/A#", audioFile: "Bb_Ad.mp3" },
        { count: 6, accidental: "sharp", mode: "major", expected: "F#/Gb", audioFile: "Fd_Gb.mp3" },
        { count: 3, accidental: "flat", mode: "minor", expected: "Cm", audioFile: "Cm.mp3" },
        { count: 2, accidental: "sharp", mode: "minor", expected: "Bm", audioFile: "Bm.mp3" },
    ])("finds $expected for $count $accidental accidentals in $mode mode", async ({ count, accidental, mode, expected, audioFile }) => {
        const interaction = renderPage();
        await chooseCount(interaction, count);
        if (accidental) {
            await interaction.click(screen.getByRole("button", { name: accidental === "flat" ? en.FLATS : en.SHARPS }));
        }
        if (mode === "minor") {
            await interaction.click(screen.getByRole("button", { name: en.MINOR }));
        }

        const findKey = screen.getByRole("button", { name: en.DETERMINE });
        expect(findKey).toBeEnabled();
        expect(within(resultRegion()).getByRole("button", { name: en.PLAY })).toBeDisabled();
        await interaction.click(findKey);

        expect(within(resultRegion()).getByText(expected, { exact: true })).toBeInTheDocument();
        expect(within(resultRegion()).getByText(mode === "major" ? en.MAJOR : en.MINOR, { exact: true })).toBeInTheDocument();
        expect(within(resultRegion()).getByRole("button", { name: en.PLAY })).toBeEnabled();
        expect(resultRegion().querySelector("audio")).toHaveAttribute("src", expect.stringContaining(audioFile));
    });

    it("saves only a calculated key with a nonblank name and trims the saved name", async () => {
        const interaction = renderPage();
        const name = screen.getByRole("textbox", { name: en.PRESET_NAME });
        const save = screen.getByRole("button", { name: en.SAVE_PRESET });

        await interaction.type(name, "Morning practice");
        expect(save).toBeDisabled();
        await chooseCount(interaction, 0);
        await interaction.click(screen.getByRole("button", { name: en.DETERMINE }));
        expect(save).toBeEnabled();

        await interaction.clear(name);
        await interaction.type(name, "   ");
        expect(save).toBeDisabled();
        await interaction.clear(name);
        await interaction.type(name, "  Morning practice  ");
        localStorage.setItem("encodedUID", "encoded-user-id");
        await interaction.click(save);

        expect(decodeBase64Mock).toHaveBeenCalledWith("encoded-user-id");
        expect(setPresetsMock).toHaveBeenCalledOnce();
        expect(setPresetsMock).toHaveBeenCalledWith({
            presetName: "Morning practice",
            presetValue: "C",
            audioPath: expect.stringContaining("C.mp3"),
            uid: "verified-user-id",
        });
        expect(dispatchMock).toHaveBeenCalledWith(setPresetsMock.mock.results[0].value);
    });

    it("shows recoverable feedback when the browser cannot play the selected tone", async () => {
        const interaction = renderPage();
        vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new Error("Playback unavailable"));
        await chooseCount(interaction, 0);
        await interaction.click(screen.getByRole("button", { name: en.DETERMINE }));
        await interaction.click(within(resultRegion()).getByRole("button", { name: en.PLAY }));

        expect(await screen.findByRole("alert")).toHaveTextContent(en.PLAYBACK_ERROR);
        expect(within(resultRegion()).getByRole("button", { name: en.PLAY })).toBeEnabled();
        expect(within(resultRegion()).getByRole("button", { name: en.PLAY })).toHaveAttribute("aria-pressed", "false");
    });

    it("lets the user cancel a tone that is still loading without showing an error", async () => {
        let rejectPlayback!: (error: Error) => void;
        vi.mocked(HTMLMediaElement.prototype.play).mockImplementationOnce(
            () =>
                new Promise((_resolve, reject) => {
                    rejectPlayback = reject;
                })
        );
        const interaction = renderPage();
        await chooseCount(interaction, 0);
        await interaction.click(screen.getByRole("button", { name: en.DETERMINE }));
        await interaction.click(within(resultRegion()).getByRole("button", { name: en.PLAY }));

        const stop = within(resultRegion()).getByRole("button", { name: en.STOP });
        expect(stop).toHaveAttribute("aria-busy", "true");
        await interaction.click(stop);
        await act(async () => {
            rejectPlayback(new Error("Playback was interrupted"));
        });

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(within(resultRegion()).getByRole("button", { name: en.PLAY })).toHaveAttribute("aria-pressed", "false");
        expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
    });

    it("ignores an old playback failure after calculating a different key", async () => {
        let rejectPlayback!: (error: Error) => void;
        vi.mocked(HTMLMediaElement.prototype.play).mockImplementationOnce(
            () =>
                new Promise((_resolve, reject) => {
                    rejectPlayback = reject;
                })
        );
        const interaction = renderPage();
        await chooseCount(interaction, 0);
        await interaction.click(screen.getByRole("button", { name: en.DETERMINE }));
        await interaction.click(within(resultRegion()).getByRole("button", { name: en.PLAY }));
        await interaction.click(screen.getByRole("button", { name: en.MINOR }));
        await interaction.click(screen.getByRole("button", { name: en.DETERMINE }));
        await act(async () => {
            rejectPlayback(new Error("The old source was replaced"));
        });

        expect(within(resultRegion()).getByText("Am", { exact: true })).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(within(resultRegion()).getByRole("button", { name: en.PLAY })).toBeEnabled();
    });
});
