import { atom } from "recoil";

// NOTE: Avoid top-level await in atoms to keep the build target compatible.
// These atoms use reasonable defaults. Callers should fetch live data from
// the API and update atoms at runtime where needed.

export const handleInstitutionName = atom({
  key: "name",
  default: "SVPCETTT",
});

export const handleInstitutionLogo = atom({
  key: "logo",
  default: "",
});

export const sessionYear = atom({
  key: "session",
  default: ["2024-2025"],
});

export const standardList = atom({
  key: "standard",
  default: [],
});

export const installmentArr = atom({
  key: "installments",
  default: [],
});

