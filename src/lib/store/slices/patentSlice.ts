import { apiService } from "../../service";
import { StateCreator } from "zustand";
import { settings } from "../../settings";
import { filterEmptyKeys } from "../../utils";

export interface PatentSliceState {
  patents: any;
  patentSearchQuery: any;
  setPatentSearchQuery: () => void;
  getAllPatents: () => void;
}

export const patentSlice: StateCreator<PatentSliceState> = (set, get) => ({
  patents: null,
  patentSearchQuery: null,
  setPatentSearchQuery: (params?: any) => {
    set({ patentSearchQuery: params });
  },
  getAllPatents: async (perPage?: number, offset?: number) => {
    const state = get();
    let params = state?.patentSearchQuery && filterEmptyKeys(state?.patentSearchQuery);
    if (perPage) {
      params = { ...params, perPage: perPage, offset: offset };
    }
    const searchParams = new URLSearchParams(params);
    await apiService
      .get(`${settings.SERVICE_URL}/api/v1/patents?${searchParams}`, (status: any, data: any) => {
        console.log(data);
        set({ patents: data });
      })
      .catch(function (error: any) {
        set({
          patents: null,
        });
        //alert(error?.response?.data);
        console.log(error.toJSON());
      });
  },
});
