import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import Presets from "./Presets";
import en from "../../translations/en";

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

vi.mock("../../redux/store", () => ({
    user: (state: typeof mockState) => state.user,
    isLoading: (state: typeof mockState) => state.isLoading,
}));

vi.mock("../../redux/thunks", () => ({
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
