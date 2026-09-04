import { render, screen } from "@testing-library/react";
import StateBadge from "../components/StateBadge";

describe("StateBadge", () => {
  it("renders the derived fill state", () => {
    render(<StateBadge state="PARTIALLY_FILLED" />);
    expect(screen.getByText("PARTIALLY_FILLED")).toBeInTheDocument();
  });
});
