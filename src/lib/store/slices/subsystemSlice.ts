import { StateCreator } from "zustand";

export interface SubsystemSliceState {
  subsystems: any;
  subsystemSearchQuery: any;
  getAllSubsystems: () => void;
  setSubsystemSearchQuery: () => void;
}

export const susbsytemSlice: StateCreator<SubsystemSliceState> = (set, get) => ({
  subsystems: null,
  subsystemSearchQuery: null,
  setSubsystemSearchQuery: (params?: any) => {
    set({ subsystemSearchQuery: params });
  },
  getAllSubsystems: async (perPage?: number, offset?: number) => {
    const state = get();
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
    set({ subsystems: { subsystems: DATA } });
    // let params = state?.subsystemSearchQuery && filterEmptyKeys(state?.subsystemSearchQuery);
    // if (perPage) {
    //   params = { ...params, perPage: perPage, offset: offset };
    // }
    // const searchParams = new URLSearchParams(params);
    // await apiService
    //   .get(
    //     `${settings.SERVICE_URL}/api/v1/subsystems?${searchParams}`,
    //     (status: any, data: any) => {
    //       console.log(data);
    //       set({ subsystems: data });
    //     }
    //   )
    //   .catch(function (error: any) {
    //     set({
    //       subsystems: null,
    //     });
    //     //alert(error?.response?.data);
    //     console.log(error.toJSON());
    //   });
  },
});
