import { apiService } from "../../service";
import { StateCreator } from "zustand";
import { settings } from "../../settings";
import { filterEmptyKeys } from "../../utils";

export interface SupportMaterialSliceState {
  supportMaterials: any;
  supportMaterialSearchQuery: any;
  getAllSupportMaterials: () => void;
  setSupportMaterialSearchQuery: () => void;
}

export const supportMaterialSlice: StateCreator<SupportMaterialSliceState> = (set, get) => ({
  supportMaterials: null,
  supportMaterialSearchQuery: null,
  setSupportMaterialSearchQuery: (params?: any) => {
    set({ supportMaterialSearchQuery: params });
  },
  getAllSupportMaterials: async (perPage?: number, offset?: number) => {
    const state = get();
    let params =
      state?.supportMaterialSearchQuery && filterEmptyKeys(state?.supportMaterialSearchQuery);
    if (perPage) {
      params = { ...params, perPage: perPage, offset: offset };
    }
    const searchParams = new URLSearchParams(params);
    await apiService
      .get(
        `${settings.SERVICE_URL}/api/v1/supportmaterials?${searchParams}`,
        (status: any, data: any) => {
          console.log(data);
          set({ supportMaterials: data });
        }
      )
      .catch(function (error: any) {
        set({
          supportMaterials: null,
        });
        console.log(error.toJSON());
      });
  },
});
