import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

import { conceptSlice, ConceptSliceState } from "./slices/conceptSlice";
import { loginSlice, LoginSliceState } from "./slices/loginSlice";
import { employeeSlice, EmployeeSliceState } from "./slices/employeeSlice";
import { moduleSlice, ModuleSliceState } from "./slices/moduleSlice";
import { patentSlice, PatentSliceState } from "./slices/patentSlice";
import { susbsytemSlice, SubsystemSliceState } from "./slices/subsystemSlice";
import { trlSlice, TrlSliceState } from "./slices/trlSlice";
import { supportMaterialSlice, SupportMaterialSliceState } from "./slices/supportMaterialSlice";

type StoreState = LoginSliceState &
  ConceptSliceState &
  EmployeeSliceState &
  ModuleSliceState &
  PatentSliceState &
  SubsystemSliceState &
  TrlSliceState &
  SupportMaterialSliceState;

export const useAppStore = create<StoreState>()(
  // devtools(
  //   persist(
  (...props) => ({
    ...loginSlice(...props),
    ...conceptSlice(...props),
    ...employeeSlice(...props),
    ...moduleSlice(...props),
    ...patentSlice(...props),
    ...susbsytemSlice(...props),
    ...trlSlice(...props),
    ...supportMaterialSlice(...props),
  })
  // ),
  //   {
  //     name: "asmlConceptAppStore",
  //   }
  // )
);
