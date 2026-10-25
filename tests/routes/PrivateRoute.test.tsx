import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import PrivateRoute from "../../src/routes/PrivateRoute";
import { authPath, tonalityPath } from "../../src/routes/routes";

const state = vi.hoisted(() => ({ signedIn: false }));

vi.mock("react-redux", () => ({
    useSelector: (selector: (value: typeof state) => unknown) => selector(state),
}));

vi.mock("../../src/redux/store", () => ({
    isSignedIn: (value: typeof state) => value.signedIn,
}));

beforeEach(() => {
    state.signedIn = false;
});

afterEach(() => cleanup());

function CurrentLocation() {
    return <output aria-label="Current route">{useLocation().pathname}</output>;
}

function ProtectedRoutes() {
    return (
        <MemoryRouter initialEntries={[tonalityPath]}>
            <Routes>
                <Route path={tonalityPath} element={<PrivateRoute routeElement={<h1>Protected workspace</h1>} />} />
                <Route path={authPath} element={<h1>Authentication destination</h1>} />
            </Routes>
            <CurrentLocation />
        </MemoryRouter>
    );
}

describe("protected routes", () => {
    it("renders the requested protected screen for an authenticated user", () => {
        state.signedIn = true;
        render(<ProtectedRoutes />);

        expect(screen.getByRole("heading", { name: "Protected workspace" })).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "Authentication destination" })).not.toBeInTheDocument();
        expect(screen.getByLabelText("Current route")).toHaveTextContent(tonalityPath);
    });

    it("redirects a signed-out user without rendering protected content", async () => {
        render(<ProtectedRoutes />);

        expect(await screen.findByRole("heading", { name: "Authentication destination" })).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "Protected workspace" })).not.toBeInTheDocument();
        expect(screen.getByLabelText("Current route")).toHaveTextContent(authPath);
    });

    it("removes protected content and returns to auth when the session ends", async () => {
        state.signedIn = true;
        const view = render(<ProtectedRoutes />);
        expect(screen.getByRole("heading", { name: "Protected workspace" })).toBeInTheDocument();

        state.signedIn = false;
        view.rerender(<ProtectedRoutes />);

        expect(await screen.findByRole("heading", { name: "Authentication destination" })).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: "Protected workspace" })).not.toBeInTheDocument();
        expect(screen.getByLabelText("Current route")).toHaveTextContent(authPath);
    });
});
