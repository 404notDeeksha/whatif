import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from './App';

describe("App shell", () => {
  it("renders the app title", () => {
    expect.hasAssertions();
    render(<App />);
    expect(screen.getByText("whatIf")).toBeInTheDocument();
  });
});
