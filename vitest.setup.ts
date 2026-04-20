import { vi } from "vitest";

vi.mock("@/src/lib/api/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));
