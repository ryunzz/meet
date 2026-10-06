import { expect, test } from "bun:test";
import { guestKey } from "./email";

test("guestKey collapses common aliasing tricks", () => {
  expect(guestKey("  Jane.Doe+spam@Gmail.com ")).toBe("janedoe@gmail.com");
  expect(guestKey("jane.doe@googlemail.com")).toBe("janedoe@gmail.com");
  expect(guestKey("first.last+x@ucsd.edu")).toBe("first.last@ucsd.edu");
});
