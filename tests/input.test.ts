import { describe, it, expect } from "vitest";
import { MAX_LENGTHS, validateFieldLengths, assertMaxLength } from "@/lib/security/input";

describe("Input Validation", () => {
  describe("assertMaxLength", () => {
    it("should return null for valid length", () => {
      expect(assertMaxLength("hello", 10, "field")).toBeNull();
    });

    it("should return error for exceeding length", () => {
      expect(assertMaxLength("hello world!", 5, "name")).toContain("name");
    });

    it("should allow exact length", () => {
      expect(assertMaxLength("12345", 5, "field")).toBeNull();
    });
  });

  describe("validateFieldLengths", () => {
    it("should return null when all fields are valid", () => {
      const result = validateFieldLengths([
        { value: "Ahmed", max: 255, name: "name" },
        { value: "test@example.com", max: 320, name: "email" },
      ]);
      expect(result).toBeNull();
    });

    it("should return first error found", () => {
      const result = validateFieldLengths([
        { value: "valid", max: 10, name: "name" },
        { value: "a".repeat(20), max: 10, name: "short" },
      ]);
      expect(result).toContain("short");
    });
  });

  describe("MAX_LENGTHS", () => {
    it("should define reasonable limits", () => {
      expect(MAX_LENGTHS.name).toBe(255);
      expect(MAX_LENGTHS.email).toBe(320);
      expect(MAX_LENGTHS.notes).toBe(2000);
      expect(MAX_LENGTHS.phone).toBe(20);
    });
  });
});
