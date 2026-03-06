/* @jest-environment jsdom */
import { act, render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "./authProvider";

// Mock the http module so AuthProvider's useEffect doesn't throw
jest.mock("../api/http", () => ({
  createHttp: jest.fn(),
  setupHttpAuth: jest.fn(),
}));

// Mock axios so axios.create at module level returns a controllable instance
jest.mock("axios", () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({ post: jest.fn() })),
    isAxiosError: jest.fn(),
  },
}));

const mockUser = {
  id: "user-1",
  username: "testuser",
  displayName: "Test User",
  isActive: true,
  permissions: [],
};

// ── Helper component ──────────────────────────────────────────────────────────

function AuthConsumer() {
  const { isAuthenticated, user, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">
        {isAuthenticated ? "authenticated" : "unauthenticated"}
      </span>
      <span data-testid="username">{user?.username ?? "none"}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("starts unauthenticated when localStorage has no token", () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId("auth-status").textContent).toBe(
      "unauthenticated"
    );
    expect(screen.getByTestId("username").textContent).toBe("none");
  });

  it("starts authenticated when access_token exists in localStorage", () => {
    localStorage.setItem("access_token", "existing_token");
    localStorage.setItem("user", JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId("auth-status").textContent).toBe("authenticated");
    expect(screen.getByTestId("username").textContent).toBe("testuser");
  });

  it("handles corrupted user JSON in localStorage gracefully", () => {
    localStorage.setItem("access_token", "token");
    localStorage.setItem("user", "not-valid-json{");

    // Should not throw
    expect(() =>
      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      )
    ).not.toThrow();
  });

  it("logout clears tokens and state", async () => {
    localStorage.setItem("access_token", "token");
    localStorage.setItem("refresh_token", "rtoken");
    localStorage.setItem("user", JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    // Verify authenticated before logout
    expect(screen.getByTestId("auth-status").textContent).toBe("authenticated");

    await act(async () => {
      screen.getByText("Logout").click();
    });

    expect(screen.getByTestId("auth-status").textContent).toBe(
      "unauthenticated"
    );
    expect(screen.getByTestId("username").textContent).toBe("none");
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
});

// ── useAuth outside provider ──────────────────────────────────────────────────

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    function Bare() {
      useAuth();
      return null;
    }
    // Suppress React's error boundary console output
    const spy = jest.spyOn(console, "error").mockImplementation(jest.fn());
    expect(() => render(<Bare />)).toThrow(
      "useAuth must be used inside <AuthProvider>"
    );
    spy.mockRestore();
  });
});
