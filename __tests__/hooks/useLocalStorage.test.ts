import { renderHook, act, waitFor } from "@testing-library/react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns initial value when no stored value exists, then hydrates", async () => {
    const { result } = renderHook(() =>
      useLocalStorage("test", "default")
    );
    await waitFor(() => {
      expect(result.current[3]).toBe(true);
    });
    expect(result.current[0]).toBe("default");
  });

  it("stores and retrieves values", () => {
    const { result } = renderHook(() =>
      useLocalStorage("test", "default")
    );
    act(() => {
      result.current[1]("new value");
    });
    expect(result.current[0]).toBe("new value");
    expect(localStorage.getItem("test")).toBe(JSON.stringify("new value"));
  });

  it("removes value and resets to initial", () => {
    const { result } = renderHook(() =>
      useLocalStorage("test", "default")
    );
    act(() => {
      result.current[1]("new value");
    });
    act(() => {
      result.current[2]();
    });
    expect(result.current[0]).toBe("default");
    expect(localStorage.getItem("test")).toBeNull();
  });

  it("reads existing value from localStorage after hydrate", async () => {
    localStorage.setItem("existing", JSON.stringify({ name: "Alice" }));
    const { result } = renderHook(() =>
      useLocalStorage("existing", { name: "" })
    );
    await waitFor(() => {
      expect(result.current[3]).toBe(true);
      expect(result.current[0]).toEqual({ name: "Alice" });
    });
  });
});
