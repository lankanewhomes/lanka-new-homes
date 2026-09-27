import { describe, expect, it } from "vitest";
import { buildInternationalPhone, cleanNationalNumber, countryFlag, getPhoneCountries, getPhoneCountry, isPlausiblePhone, parseInternationalInput } from "./phone";

describe("buildInternationalPhone", () => {
  it("prefixes the country's calling code and drops the local trunk 0", () => {
    expect(buildInternationalPhone("LK", "077 123 4567")).toBe("+94 77 123 4567");
    expect(buildInternationalPhone("LK", "77 123 4567")).toBe("+94 77 123 4567");
    expect(buildInternationalPhone("GB", "07911 123456")).toBe("+44 7911 123456");
    expect(buildInternationalPhone("CA", "(416) 555-0199")).toBe("+1 (416) 555-0199");
    expect(buildInternationalPhone("AE", "50 123 4567")).toBe("+971 50 123 4567");
  });

  it("keeps the leading 0 for Italy, where it is part of the number", () => {
    expect(buildInternationalPhone("IT", "06 1234 5678")).toBe("+39 06 1234 5678");
  });

  it("returns null when nothing usable was typed", () => {
    expect(buildInternationalPhone("LK", "")).toBeNull();
    expect(buildInternationalPhone("LK", "abc")).toBeNull();
    expect(buildInternationalPhone("LK", "0")).toBeNull();
  });

  it("falls back to Sri Lanka for an unknown country", () => {
    expect(buildInternationalPhone("ZZ", "77 123 4567")).toBe("+94 77 123 4567");
  });
});

describe("parseInternationalInput", () => {
  it("recognises a pasted +number and picks the country from the longest matching code", () => {
    expect(parseInternationalInput("+94 77 123 4567")).toEqual({ iso: "LK", national: "771234567" });
    expect(parseInternationalInput("+44 7911 123456")).toEqual({ iso: "GB", national: "7911123456" });
    expect(parseInternationalInput("+971501234567")).toEqual({ iso: "AE", national: "501234567" });
    expect(parseInternationalInput("+1 416 555 0199")).toEqual({ iso: "US", national: "4165550199" });
  });

  it("accepts the 00 international prefix", () => {
    expect(parseInternationalInput("0044 7911 123456")).toEqual({ iso: "GB", national: "7911123456" });
  });

  it("leaves a plain local number alone", () => {
    expect(parseInternationalInput("077 123 4567")).toBeNull();
    expect(parseInternationalInput("771234567")).toBeNull();
  });
});

describe("isPlausiblePhone", () => {
  it("accepts real-length numbers and rejects junk", () => {
    expect(isPlausiblePhone("LK", "77 123 4567")).toBe(true);
    expect(isPlausiblePhone("US", "4165550199")).toBe(true);
    expect(isPlausiblePhone("LK", "12")).toBe(false);
    expect(isPlausiblePhone("LK", "")).toBe(false);
    expect(isPlausiblePhone("US", "1234567890123456")).toBe(false);
  });
});

describe("country list", () => {
  it("leads with Sri Lanka and has no country twice", () => {
    const { common, others } = getPhoneCountries();
    expect(common[0].iso).toBe("LK");
    const isos = [...common, ...others].map((country) => country.iso);
    expect(new Set(isos).size).toBe(isos.length);
    expect(isos.length).toBeGreaterThan(200);
  });

  it("builds flag emoji and resolves countries", () => {
    expect(countryFlag("LK")).toBe("🇱🇰");
    expect(getPhoneCountry("GB").dial).toBe("44");
    expect(getPhoneCountry("nonsense").iso).toBe("LK");
  });
});

describe("typing an international number digit by digit", () => {
  it("keeps the + while typing and never leaks it into the stored number", () => {
    expect(cleanNationalNumber("+44 79")).toBe("+44 79");
    expect(cleanNationalNumber("abc+4x")).toBe("4");
    expect(buildInternationalPhone("LK", "+999 123 4567")).toBe("+94 999 123 4567");
  });
});
