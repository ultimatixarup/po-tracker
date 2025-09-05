import { apiService } from "../../service";
import { StateCreator } from "zustand";
import { settings } from "../../settings";
export interface LoginInfoProps {
  accessToken?: string;
  refreshToken?: string;
  role?: string;
  errorMessage?: any;
}

export interface LoginActionPayload {
  email: string;
  password: string;
}

export interface LoginSliceState {
  loginInfo: LoginInfoProps | null;
  loginAction: (params: LoginActionPayload) => Promise<LoginInfoProps | null>;
  logoutAction: () => void;
}

export const loginSlice: StateCreator<LoginSliceState> = (set, get) => ({
  loginInfo: null,
  loginAction: async ({ email, password }) => {
    localStorage.clear();
    await apiService
      .post(
        `${settings.API_URL}/api/v1/auth/authenticate`,
        { email, password },
        (status: any, data: any) => {
          set({ loginInfo: data?.data });
          localStorage.setItem("accessToken", data?.data?.access_token);
        }
      )
      .catch(function (error) {
        set({
          loginInfo: {
            ...get().loginInfo,
            errorMessage: error?.response.data
              ? `${error.response.data.message}: ${error.response.data.data}`
              : null,
          },
        });
        console.log(error.toJSON());
      });
    return get().loginInfo;
  },
  logoutAction: async () => {
    localStorage.clear();
    set({ loginInfo: null });
  },
});
