import { apiService } from "../../service";
import { StateCreator } from "zustand";
import { settings } from "../../settings";
import { filterEmptyKeys } from "../../utils";

export interface TrlSliceState {
  trlAdvancements: any;
  trlSearchQuery: any;
  getAllTrlAdvancements: () => void;
  setTrlSearchQuery: () => void;
}

export const trlSlice: StateCreator<TrlSliceState> = (set, get) => ({
  trlAdvancements: null,
  trlSearchQuery: null,
  setTrlSearchQuery: (params?: any) => {
    set({ trlSearchQuery: params });
  },
  getAllTrlAdvancements: async (perPage?: number, offset?: number) => {
    const state = get();
    let params = state?.trlSearchQuery && filterEmptyKeys(state?.trlSearchQuery);
    if (perPage) {
      params = { ...params, perPage: perPage, offset: offset };
    }
    const searchParams = new URLSearchParams(params);
    await apiService
      .get(`${settings.SERVICE_URL}/api/v1/trls?${searchParams}`, (status: any, data: any) => {
        console.log(data);
        set({ trlAdvancements: data });
      })
      .catch(function (error: any) {
        set({
          trlAdvancements: null,
        });
        //alert(error?.response?.data);
        console.log(error.toJSON());
      });
  },
});
