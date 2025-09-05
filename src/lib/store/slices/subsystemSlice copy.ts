import { apiService } from "../../service";
import { StateCreator } from "zustand";
import { settings } from "../../settings";
import { filterEmptyKeys } from "../../utils";

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
    let params = state?.subsystemSearchQuery && filterEmptyKeys(state?.subsystemSearchQuery);
    if (perPage) {
      params = { ...params, perPage: perPage, offset: offset };
    }
    const searchParams = new URLSearchParams(params);
    await apiService
      .get(
        `${settings.SERVICE_URL}/api/v1/subsystems?${searchParams}`,
        (status: any, data: any) => {
          console.log(data);
          set({ subsystems: data });
        }
      )
      .catch(function (error: any) {
        set({
          subsystems: null,
        });
        //alert(error?.response?.data);
        console.log(error.toJSON());
      });
  },
});
