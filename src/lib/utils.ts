export const filterEmptyKeys = (obj: any): any => {
  return Object.entries(obj)
    .filter(([_, v]) => v !== null && v !== "")
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v === Object(v) ? filterEmptyKeys(v) : v }), {});
};

export const TabItems = Object.freeze({
  SUBSYSTEMS: "subsystems",
  SUPPORT_MATERIALS: "support-material",
  AUTHORS: "authors",
  PATENTS: "patents",
  TRL_ADVANCEMENTS: "trl-advancements",
  BUSINESS_IMPACTS: "business-impacts",
  CONCEPT_FUNCTIONS: "concept-functions",
});

export const ConceptsStatusEnum = Object.freeze({
  1: "Completed",
  2: "In-Progress",
  3: "Not Started",
});

export const PatentStatusEnum = Object.freeze({
  1: "Filed",
  2: "Approved",
  3: "Denied",
  4: "Withdrawn",
  5: "Reexamined",
  6: "Reissued",
  7: "Inactive",
});

export const ConceptsStatusColorEnum = Object.freeze({
  1: "primary",
  2: "success",
  3: "error",
  4: "warning",
  5: "light",
  6: "info",
  7: "red",
});

export const SupportMaterialEnum = Object.freeze({
  1: "PDF",
  2: "Archive",
  3: "Local Database",
  4: "Presentation",
  5: "ebook",
});
