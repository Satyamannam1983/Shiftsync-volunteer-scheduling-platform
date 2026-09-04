import { render, screen } from "@testing-library/react";
import StateBadge from "./StateBadge";

describe("StateBadge", () => {
  it("renders the derived fill state", () => {
    render(<StateBadge state="PARTIALLY_FILLED" />);
    expect(screen.getByText("PARTIALLY_FILLED")).toBeInTheDocument();
  });
});
