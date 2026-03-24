import { describe, it, expect } from "vitest";
import { splitMessage, MAX_MESSAGE_LENGTH } from "./telegram";

describe("splitMessage", () => {
  it("should not split a short message", () => {
    const text = "Hello world";
    const chunks = splitMessage(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it("should split a very long message", () => {
    // Create a string longer than MAX_MESSAGE_LENGTH
    const text = "A".repeat(MAX_MESSAGE_LENGTH + 100);
    const chunks = splitMessage(text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBeLessThanOrEqual(MAX_MESSAGE_LENGTH);
  });

  it("should split at word boundaries (space)", () => {
    const word = "Data";
    const space = " ";
    // construct a message that would break a word if split exactly at MAX_MESSAGE_LENGTH
    // but should split at the last space instead
    const padding = "X".repeat(MAX_MESSAGE_LENGTH - 10);
    const text = padding + space + "BreakingWord"; 
    
    const chunks = splitMessage(text);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toBe(padding);
    expect(chunks[1]).toBe("BreakingWord");
  });

  it("should split at newline if available", () => {
    // padding + \n + "NextLine" should be > MAX_MESSAGE_LENGTH
    const padding = "X".repeat(MAX_MESSAGE_LENGTH - 5);
    const text = padding + "\n" + "This should be on the next line because the total length exceeds the limit";
    
    const chunks = splitMessage(text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]).toBe(padding);
  });
});
