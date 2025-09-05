import { StateCreator } from "zustand";
import { apiService } from "../../service";
import { filterEmptyKeys } from "../../utils";
import { settings } from "../../settings";

export interface EmployeeSliceState {
  employees: any;
  employeeInfo: any;
  employeeSearchQuery: any;
  employeeConcepts: any;
  getAllEmployees: (perPage?: number, offset?: number) => void;
  getEmployeeInfoById: (employeeId: string) => void;
  getEmployeeConceptsById: (employeeId: string) => void;
}

export const employeeSlice: StateCreator<EmployeeSliceState> = (set, get) => ({
  employees: null,
  employeeInfo: null,
  employeeSearchQuery: null,
  employeeConcepts: null,
  setEmployeeSearchQuery: (params?: any) => {
    set({ employeeSearchQuery: params });
  },
  getAllEmployees: async (perPage?: number, offset?: number) => {
    const state = get();
    let params = state?.employeeSearchQuery && filterEmptyKeys(state?.employeeSearchQuery);
    if (perPage) {
      params = { ...params, perPage: perPage, offset: offset };
    }
    const searchParams = new URLSearchParams(params);

    const employeesURL = `${settings.SERVICE_URL}/api/v1/employees?${searchParams}`;
    await apiService
      .get(employeesURL, (status: any, data: any) => {
        console.log(data);
        set({ employees: data });
      })
      .catch(function (error: any) {
        set({
          employees: null,
        });
        //alert(error?.response?.data);
        console.log(error.toJSON());
      });
  },
  getEmployeeInfoById: async (employeeId: string) => {
    await apiService
      .get(`${settings.SERVICE_URL}/api/v1/employees/${employeeId}`, (status: any, data: any) => {
        console.log(data);
        set({ employeeInfo: data?.length > 0 ? data[0] : null });
      })
      .catch(function (error: any) {
        set({
          employeeInfo: null,
        });
        //alert(error?.response?.data);
        console.log(error.toJSON());
      });
  },
  getEmployeeConceptsById: async (employeeId: string) => {
    await apiService
      .get(
        `${settings.SERVICE_URL}/api/v1/employees/${employeeId}/concepts`,
        (status: any, data: any) => {
          console.log(data);
          set({ employeeConcepts: Array.isArray(data) ? data : null });
        }
      )
      .catch(function (error: any) {
        set({
          employeeConcepts: null,
        });
        //alert(error?.response?.data);
        console.log(error.toJSON());
      });
  },
});
