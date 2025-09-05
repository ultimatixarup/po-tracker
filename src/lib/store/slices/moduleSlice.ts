import { StateCreator } from "zustand";

export interface ModuleSliceState {
  modules: any;
  getAllModules: () => void;
  modulesSearchQuery: any;
  setModulesSearchQuery: () => void;
}

export const moduleSlice: StateCreator<ModuleSliceState> = (set, get) => ({
  modules: null,
  modulesSearchQuery: null,
  setModulesSearchQuery: (params?: any) => {
    set({ modulesSearchQuery: params });
  },
  getAllModules: async (perPage?: number, offset?: number) => {
    alert("here");
    const DATA = [
      {
        id: 1,
        WBS: "WBS",
        PCM: "PCM",
        PL: "PL",
        GL: "GL",
        projectName: "projectName",
        projectStart: "projectStart",
        WkStart: "wkStart",
        ProjectEnd: "projectEnd",
        WkEnd: "wkEnd",
        PRNumber: "prNumber",
        PRStatus: "prStatus",
        PO: "po",
        POManWks: "poManWks",
        PRAmount: "po",
        PRWklyRate: "po",
        POMonthlyBillRate: "po",
        action: "action",
      },
      {
        id: 2,
        WBS: "WBS",
        PCM: "PCM",
        PL: "PL",
        GL: "GL",
        projectName: "projectName",
        projectStart: "projectStart",
        WkStart: "wkStart",
        ProjectEnd: "projectEnd",
        WkEnd: "wkEnd",
        PRNumber: "prNumber",
        PRStatus: "prStatus",
        PO: "po",
        POManWks: "poManWks",
        PRAmount: "po",
        PRWklyRate: "po",
        POMonthlyBillRate: "po",
        action: "action",
      },
    ];
    set({ modules: DATA });

    /* const state = get();
    let params = state?.modulesSearchQuery && filterEmptyKeys(state?.modulesSearchQuery);
    if (perPage) {
      params = { ...params, perPage: perPage, offset: offset };
    }
    const searchParams = new URLSearchParams(params);
    await apiService
      .get(`${settings.SERVICE_URL}/api/v1/modules?${searchParams}`, (status: any, data: any) => {
        console.log(data);
        set({ modules: data });
      })
      .catch(function (error: any) {
        set({
          modules: null,
        });
        console.log(error.toJSON());
      });
      */
  },
});
