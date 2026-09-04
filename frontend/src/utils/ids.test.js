import { currentUserId, sameId } from "./ids";

describe("id helpers", () => {
  it("compares ids as strings", () => {
    expect(sameId("abc", "abc")).toBe(true);
    expect(sameId("a", "b")).toBe(false);
  });

  it("reads login user id from either id or _id", () => {
    expect(currentUserId({ id: "1" })).toBe("1");
    expect(currentUserId({ _id: "2" })).toBe("2");
  });
});
