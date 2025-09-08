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
    const ymd = (d: Date) => d.toISOString().slice(0, 10);
    const now = new Date();
    const wkEnd = new Date(now);
    wkEnd.setDate(now.getDate() + 6);
    const projEnd = new Date(now);
    projEnd.setMonth(now.getMonth() + 3);

    const DATA = [
      {
        id: `NEW-${Date.now()}`,
        PMS: "PMS-001",
        WBS: "WBS-000X",
        PCM: "PCM-001",
        PL: "PL-01",
        GL: "GL-01",
        FOProjectName: "New Project",
        POProjectStart: ymd(now),
        WkStart: ymd(now),
        ProjectEnd: ymd(projEnd),
        WkEnd: ymd(wkEnd),
        PRNumber: "PR-100X",
        PRStatus: "OPEN",
        PO: "PO-200X",
        POManWks: 4,
        PRAmount: 5000,
        PRWklyRate: 1250,
        POMonthlyBillRate: 20000,
      },
      {
        id: `NEW-${Date.now()}`,
        PMS: "PMS-001",
        WBS: "WBS-000X",
        PCM: "PCM-001",
        PL: "PL-01",
        GL: "GL-01",
        FOProjectName: "New Project",
        POProjectStart: ymd(now),
        WkStart: ymd(now),
        ProjectEnd: ymd(projEnd),
        WkEnd: ymd(wkEnd),
        PRNumber: "PR-100X",
        PRStatus: "OPEN",
        PO: "PO-200X",
        POManWks: 4,
        PRAmount: 5000,
        PRWklyRate: 1250,
        POMonthlyBillRate: 20000,
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
