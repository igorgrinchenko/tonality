import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import Presets from "../../../src/components/pages/Presets";
import en from "../../../src/translations/en";
import { tonalityPath } from "../../../src/routes/routes";

const { dispatchMock, deletePresetsMock, mockState } = vi.hoisted(() => ({
    dispatchMock: vi.fn(),
    deletePresetsMock: vi.fn((payload: unknown) => ({ type: "test/delete-request", payload })),
    mockState: {
        user: {
            language: "en",
            presets: [] as { presetId: number; presetName: string; presetValue: string; audioPath: string; uid: string }[],
        },
        isLoading: false,
    },
}));

vi.mock("react-redux", () => ({
    useDispatch: () => dispatchMock,
    useSelector: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

vi.mock("../../../src/redux/store", () => ({
    user: (state: typeof mockState) => state.user,
    isLoading: (state: typeof mockState) => state.isLoading,
}));

vi.mock("../../../src/redux/thunks", () => ({
    decodeBase64: () => "verified-user-id",
    deletePresets: Object.assign(deletePresetsMock, {
        fulfilled: { match: (action: { type: string }) => action.type === "test/delete/fulfilled" },
    }),
}));

function pendingDeletion() {
    let resolve: (result: { type: string }) => void = () => undefined;
    const promise = new Promise<{ type: string }>((resolvePromise) => {
        resolve = resolvePromise;
    });
    return { promise, resolve };
}

beforeEach(() => {
    vi.clearAllMocks();
    dispatchMock.mockReset();
    localStorage.clear();
    localStorage.setItem("encodedUID", "encoded-user-id");
    mockState.user.presets = [
        { presetId: 0, presetName: "Warm-up", presetValue: "C", audioPath: "/warm-up.mp3", uid: "verified-user-id" },
        { presetId: 1, presetName: "Evening practice", presetValue: "Am", audioPath: "/evening.mp3", uid: "verified-user-id" },
    ];
    mockState.isLoading = false;
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

function renderPage() {
    const interaction = userEvent.setup();
    render(
        <MemoryRouter>
            <Presets />
        </MemoryRouter>
    );
    return interaction;
}

function presetRow(name: string) {
    const row = screen.getByRole("heading", { name }).closest("li");
    if (!row) {
        throw new Error(`Missing preset row: ${name}`);
    }
    return row;
}

async function playEveningPreset(interaction: ReturnType<typeof userEvent.setup>) {
    await interaction.click(within(presetRow("Evening practice")).getByRole("button", { name: `${en.PLAY} Evening practice` }));
    await waitFor(() => expect(within(presetRow("Evening practice")).getByRole("button", { name: `${en.STOP} Evening practice` })).toBeEnabled());
}

async function confirmDeletion(interaction: ReturnType<typeof userEvent.setup>, name: string) {
    await interaction.click(within(presetRow(name)).getByRole("button", { name: `${en.DELETE} ${name}` }));
    await interaction.click(within(screen.getByRole("dialog", { name: en.PRESET_DELETE_TITLE })).getByRole("button", { name: en.DELETE }));
}

describe("saved-key deletion while audio is playing", () => {
    it("keeps the Stop control and playing marker on the original row when deleting an earlier preset fails", async () => {
        const deletion = pendingDeletion();
        dispatchMock.mockReturnValueOnce(deletion.promise);
        const interaction = renderPage();
        await playEveningPreset(interaction);
        await confirmDeletion(interaction, "Warm-up");

        await act(async () => {
            deletion.resolve({ type: "test/delete/rejected" });
            await deletion.promise;
        });
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

        expect(within(presetRow("Evening practice")).getByRole("button", { name: `${en.STOP} Evening practice` })).toHaveAttribute("aria-pressed", "true");
        expect(within(presetRow("Evening practice")).getByText(en.AUDIO_PLAYING)).toBeInTheDocument();
        expect(within(presetRow("Warm-up")).getByRole("button", { name: `${en.PLAY} Warm-up` })).toHaveAttribute("aria-pressed", "false");
        expect(within(presetRow("Warm-up")).queryByText(en.AUDIO_PLAYING)).not.toBeInTheDocument();
        expect(deletePresetsMock).toHaveBeenCalledWith({ presetId: 0, uid: "verified-user-id" });
    });

    it("keeps the same track marked as playing after an earlier preset is successfully removed", async () => {
        const deletion = pendingDeletion();
        dispatchMock.mockReturnValueOnce(deletion.promise);
        const interaction = renderPage();
        await playEveningPreset(interaction);
        await confirmDeletion(interaction, "Warm-up");

        await act(async () => {
            mockState.user.presets = mockState.user.presets.slice(1);
            deletion.resolve({ type: "test/delete/fulfilled" });
            await deletion.promise;
        });
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

        expect(screen.queryByRole("heading", { name: "Warm-up" })).not.toBeInTheDocument();
        expect(within(presetRow("Evening practice")).getByRole("button", { name: `${en.STOP} Evening practice` })).toHaveAttribute("aria-pressed", "true");
        expect(within(presetRow("Evening practice")).getByText(en.AUDIO_PLAYING)).toBeInTheDocument();
        expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
    });

    it("does not stop the current track when deletion of that track fails", async () => {
        const deletion = pendingDeletion();
        dispatchMock.mockReturnValueOnce(deletion.promise);
        const interaction = renderPage();
        await playEveningPreset(interaction);
        vi.mocked(HTMLMediaElement.prototype.pause).mockClear();
        await confirmDeletion(interaction, "Evening practice");

        await act(async () => {
            deletion.resolve({ type: "test/delete/rejected" });
            await deletion.promise;
        });
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

        expect(HTMLMediaElement.prototype.pause).not.toHaveBeenCalled();
        expect(within(presetRow("Evening practice")).getByRole("button", { name: `${en.STOP} Evening practice` })).toHaveAttribute("aria-pressed", "true");
    });
});

describe("saved music interactions", () => {
    it("provides a route back to finding keys when the collection is empty", () => {
        mockState.user.presets = [];
        renderPage();

        expect(screen.getByRole("heading", { name: en.EMPTY_PRESETS_TITLE })).toBeInTheDocument();
        expect(screen.getByText(en.EMPTY_PRESETS_DESCRIPTION)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: en.FIND_A_KEY })).toHaveAttribute("href", tonalityPath);
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: new RegExp(`^${en.DELETE}`) })).not.toBeInTheDocument();
    });

    it("shows the saved count, names and key values without requiring playback", () => {
        renderPage();
        const collection = screen.getByRole("region", { name: en.SAVED_KEYS });

        expect(within(collection).getByText("2", { exact: true })).toBeInTheDocument();
        expect(within(collection).getAllByRole("listitem")).toHaveLength(2);
        expect(within(presetRow("Warm-up")).getByText("C", { exact: true })).toBeInTheDocument();
        expect(within(presetRow("Evening practice")).getByText("Am", { exact: true })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: en.FIND_A_KEY })).toHaveAttribute("href", tonalityPath);
        expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    });

    it("lets the user cancel deletion without dispatching a request or changing the collection", async () => {
        const interaction = renderPage();
        await interaction.click(within(presetRow("Warm-up")).getByRole("button", { name: `${en.DELETE} Warm-up` }));
        const dialog = screen.getByRole("dialog", { name: en.PRESET_DELETE_TITLE });
        expect(dialog).toHaveTextContent("Warm-up");
        await interaction.click(within(dialog).getByRole("button", { name: en.CANCEL }));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(deletePresetsMock).not.toHaveBeenCalled();
        expect(dispatchMock).not.toHaveBeenCalled();
        expect(screen.getAllByRole("listitem")).toHaveLength(2);
    });

    it("switches the looped recording and stops the selected track on request", async () => {
        const interaction = renderPage();
        await interaction.click(within(presetRow("Warm-up")).getByRole("button", { name: `${en.PLAY} Warm-up` }));
        await waitFor(() => expect(within(presetRow("Warm-up")).getByRole("button", { name: `${en.STOP} Warm-up` })).toBeEnabled());
        expect(document.querySelector("audio")).toHaveAttribute("src", "/warm-up.mp3");
        expect(document.querySelector("audio")).toHaveAttribute("loop");

        await playEveningPreset(interaction);
        expect(within(presetRow("Warm-up")).getByRole("button", { name: `${en.PLAY} Warm-up` })).toHaveAttribute("aria-pressed", "false");
        expect(document.querySelector("audio")).toHaveAttribute("src", "/evening.mp3");
        await interaction.click(within(presetRow("Evening practice")).getByRole("button", { name: `${en.STOP} Evening practice` }));

        expect(within(presetRow("Evening practice")).getByRole("button", { name: `${en.PLAY} Evening practice` })).toHaveAttribute("aria-pressed", "false");
        expect(screen.queryByText(en.AUDIO_PLAYING)).not.toBeInTheDocument();
        expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
    });

    it("allows retrying a saved recording after playback fails", async () => {
        vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new Error("Audio unavailable"));
        const interaction = renderPage();
        await interaction.click(within(presetRow("Warm-up")).getByRole("button", { name: `${en.PLAY} Warm-up` }));

        expect(await screen.findByRole("alert")).toHaveTextContent(en.PLAYBACK_ERROR);
        expect(within(presetRow("Warm-up")).getByRole("button", { name: `${en.PLAY} Warm-up` })).toBeEnabled();
        await interaction.click(within(presetRow("Warm-up")).getByRole("button", { name: `${en.PLAY} Warm-up` }));
        await waitFor(() => expect(within(presetRow("Warm-up")).getByRole("button", { name: `${en.STOP} Warm-up` })).toBeEnabled());

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
    });

    it("prevents competing playback and deletion while a recording is starting", async () => {
        let resolvePlayback!: () => void;
        vi.mocked(HTMLMediaElement.prototype.play).mockImplementationOnce(
            () =>
                new Promise<void>((resolve) => {
                    resolvePlayback = resolve;
                })
        );
        const interaction = renderPage();
        await interaction.click(within(presetRow("Warm-up")).getByRole("button", { name: `${en.PLAY} Warm-up` }));

        expect(within(presetRow("Warm-up")).getByRole("button", { name: `${en.STOP} Warm-up` })).toBeDisabled();
        expect(within(presetRow("Evening practice")).getByRole("button", { name: `${en.PLAY} Evening practice` })).toBeDisabled();
        expect(within(presetRow("Warm-up")).getByRole("button", { name: `${en.DELETE} Warm-up` })).toBeDisabled();
        expect(within(presetRow("Evening practice")).getByRole("button", { name: `${en.DELETE} Evening practice` })).toBeDisabled();

        await act(async () => {
            resolvePlayback();
        });
        await waitFor(() => expect(within(presetRow("Warm-up")).getByRole("button", { name: `${en.STOP} Warm-up` })).toBeEnabled());
        expect(within(presetRow("Evening practice")).getByRole("button", { name: `${en.PLAY} Evening practice` })).toBeEnabled();
        expect(within(presetRow("Evening practice")).getByRole("button", { name: `${en.DELETE} Evening practice` })).toBeEnabled();
        expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
    });

    it("keeps deletion available but cannot play a preset without a recording", () => {
        mockState.user.presets[0].audioPath = "";
        renderPage();

        expect(within(presetRow("Warm-up")).getByRole("button", { name: `${en.PLAY} Warm-up` })).toBeDisabled();
        expect(within(presetRow("Warm-up")).getByRole("button", { name: `${en.DELETE} Warm-up` })).toBeEnabled();
    });

    it("pauses saved music when the user leaves the page", async () => {
        const interaction = userEvent.setup();
        const view = render(
            <MemoryRouter>
                <Presets />
            </MemoryRouter>
        );
        await playEveningPreset(interaction);
        vi.mocked(HTMLMediaElement.prototype.pause).mockClear();
        view.unmount();

        expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledOnce();
    });
});
