import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns initial value when no stored value exists", () => {
    const { result } = renderHook(() =>
      useLocalStorage("test", "default")
    );
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

  it("reads existing value from localStorage", () => {
    localStorage.setItem("existing", JSON.stringify({ name: "Alice" }));
    const { result } = renderHook(() =>
      useLocalStorage("existing", { name: "" })
    );
    expect(result.current[0]).toEqual({ name: "Alice" });
  });
});
