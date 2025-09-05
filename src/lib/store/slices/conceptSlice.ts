import { StateCreator } from "zustand";
import { apiService } from "../../service";
import { settings } from "../../settings";

export interface ConceptInfo {
  WBS: string;
  PCM: string;
  PL: string;
  GL: string;
  projectName: string;
  projectStart: string;
  WkStart: string;
  ProjectEnd: string;
  WkEnd: string;
  PRNumber: string;
  PRStatus: string;
  PO: string;
  POManWks: string;
  PRAmount: string;
  PRWklyRate: string;
  POMonthlyBillRate: string;
  action: string;
}
export interface ConceptsInfoProps {
  conceptsInfo?: ConceptInfo[];
}

export interface ConceptParamsProps {
  title: string;
  status: string;
  description: string;
}

export interface ConceptSliceState {
  conceptsInfo: ConceptsInfoProps | null;
  conceptInfo: ConceptInfo | null;
  errorMessage?: string;
  conceptSearchQuery?: any;
  editConceptInfo: any;
  getConceptByIdAction: (conceptId: string) => void;
  setConceptSearchQuery: (params?: ConceptParamsProps) => void;
  getConceptsAction: () => void;
  deleteConceptAction: (conceptId: string) => void;
  subSystems: any;
  supportMaterials: any;
  authors: any;
  patents: any;
  trlAdvancements: any;
  businessImpacts: any;
  conceptFunctions: any;
  getSubsystems: (conceptId: string) => void;
  getConceptFunctions: (conceptId: string) => void;
  //getAllSupportMaterials: () => void;
  // getAllTrlAdvancements: () => void;
  resetDefaultItems: () => void;
  resetConceptinfo: () => void;
}

export const conceptSlice: StateCreator<ConceptSliceState> = (set, get) => ({
  conceptInfo: null,
  conceptsInfo: null,
  editConceptInfo: null,
  conceptSearchQuery: null,
  subSystems: null,
  supportMaterials: null,
  authors: null,
  patents: null,
  trlAdvancements: null,
  businessImpacts: null,
  conceptFunctions: null,
  resetDefaultItems: () => {
    set({
      subSystems: null,
      supportMaterials: null,
      authors: null,
      patents: null,
      trlAdvancements: null,
      businessImpacts: null,
    });
  },
  resetConceptinfo: () => {
    set({
      conceptInfo: null,
    });
  },
  getConceptByIdAction: async (conceptId: string) => {
    const conceptDetailsURL = `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}`;
    await apiService
      .get(conceptDetailsURL, (status: any, data: ConceptInfo[]) => {
        set({ conceptInfo: data && data?.length > 0 ? data[0] : null });
      })
      .catch(function (error) {
        set({
          errorMessage: error?.response?.data,
          // ? `${error.response.data.message}: ${error.response.data.data}`
          // : "",
        });
        //alert(error?.response?.data);
        console.log(error.toJSON());
      });
  },
  getConceptsAction: async () => {
    const DATA = [
      {
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
    set({ conceptsInfo: { conceptsInfo: DATA } });
  },
  deleteConceptAction: async (conceptId: string) => {
    await apiService
      .delete(
        `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}`,
        {},
        (status: any, data: ConceptsInfoProps) => {
          get().getConceptsAction();
        }
      )
      .catch(function (error) {
        alert(
          "Can't delete this concept because of its dependences. To delete this concept, delete it dependences first."
        );
        set({
          errorMessage: error?.response?.data
            ? `${error.response.data.message}: ${error.response.data.data}`
            : "",
        });
        console.log(error.toJSON());
      });
  },
  editConceptAction: async (concept: any) => {
    set({ editConceptInfo: concept });
  },
  setConceptSearchQuery: (params?: ConceptParamsProps) => {
    set({ conceptSearchQuery: params });
  },

  getSubsystems: async (conceptId: string) => {
    if (!conceptId) return;

    await apiService
      .get(
        `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}/susbsystems`,
        (status: any, data: any) => {
          set({ subSystems: Array.isArray(data) ? data : null });
        }
      )
      .catch(function (error) {
        set({
          subSystems: null,
          errorMessage: error?.response?.data,
          // ? `${error.response.data.message}: ${error.response.data.data}`
          // : "",
        });
        //alert(error?.response?.data);
        console.log(error.toJSON());
      });
  },
  getSupportMaterials: async (conceptId: string) => {
    if (!conceptId) return;

    await apiService
      .get(
        `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}/supportmaterials`,
        (status: any, data: any) => {
          set({ supportMaterials: Array.isArray(data) ? data : null });
        }
      )
      .catch(function (error) {
        set({
          supportMaterials: null,
          errorMessage: error?.response?.data,
          // ? `${error.response.data.message}: ${error.response.data.data}`
          // : "",
        });
        //alert(error?.response?.data);
        console.log(error.toJSON());
      });
  },
  getAuthors: async (conceptId: string) => {
    if (!conceptId) return;
    await apiService
      .get(
        `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}/employees`,
        (status: any, data: any) => {
          set({ authors: Array.isArray(data) ? data : null });
        }
      )
      .catch(function (error) {
        set({
          authors: null,
          errorMessage: error?.response?.data,
          // ? `${error.response.data.message}: ${error.response.data.data}`
          // : "",
        });
        //alert(error?.response?.data);
        console.log(error.toJSON());
      });
  },

  // getAllSupportMaterials: async () => {
  //   await apiService
  //     .get(`${settings.SERVICE_URL}/api/v1/supportmaterials`, (status: any, data: any) => {
  //       console.log(data);
  //       //set({ employees: Array.isArray(data.employees) ? data.employees : null });
  //       set({ supportMaterials: data?.supportMaterials });
  //     })
  //     .catch(function (error) {
  //       set({
  //         supportMaterials: null,
  //         errorMessage: error?.response?.data,
  //         // ? `${error.response.data.message}: ${error.response.data.data}`
  //         // : "",
  //       });
  //       //alert(error?.response?.data);
  //       console.log(error.toJSON());
  //     });
  // },

  // getAllTrlAdvancements: async () => {
  //   await apiService
  //     .get(`${settings.SERVICE_URL}/api/v1/trls`, (status: any, data: any) => {
  //       console.log(data);
  //       //set({ employees: Array.isArray(data.employees) ? data.employees : null });
  //       set({ trlAdvancements: data?.trls });
  //     })
  //     .catch(function (error) {
  //       set({
  //         trlAdvancements: null,
  //         errorMessage: error?.response?.data,
  //         // ? `${error.response.data.message}: ${error.response.data.data}`
  //         // : "",
  //       });
  //       //alert(error?.response?.data);
  //       console.log(error.toJSON());
  //     });
  // },

  getPatents: async (conceptId: string) => {
    if (!conceptId) return;
    await apiService
      .get(
        `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}/patents`,
        (status: any, data: any) => {
          set({ patents: Array.isArray(data) ? data : null });
        }
      )
      .catch(function (error) {
        set({
          patents: null,
          errorMessage: error?.response?.data,
          // ? `${error.response.data.message}: ${error.response.data.data}`
          // : "",
        });
        //alert(error?.response?.data);
        console.log(error.toJSON());
      });
  },
  getTRLAdvancements: async (conceptId: string) => {
    if (!conceptId) return;
    await apiService
      .get(
        `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}/trls`,
        (status: any, data: any) => {
          set({ trlAdvancements: Array.isArray(data) ? data : null });
        }
      )
      .catch(function (error) {
        set({
          trlAdvancements: null,
          errorMessage: error?.response?.data,
          // ? `${error.response.data.message}: ${error.response.data.data}`
          // : "",
        });
        //alert(error?.response?.data);
        console.log(error.toJSON());
      });
  },

  getBusinessImpacts: async (conceptId: string) => {
    if (!conceptId) return;
    await apiService
      .get(
        `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}/businessimpacts`,
        (status: any, data: any) => {
          set({ businessImpacts: Array.isArray(data) ? data : null });
        }
      )
      .catch(function (error) {
        set({
          businessImpacts: null,
          errorMessage: error?.response?.data,
          // ? `${error.response.data.message}: ${error.response.data.data}`
          // : "",
        });
        //alert(error?.response?.data);
        console.log(error.toJSON());
      });
  },
  getConceptFunctions: async (conceptId: string) => {
    if (!conceptId) return;
    await apiService
      .get(
        `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}/functions`,
        (status: any, data: any) => {
          set({ conceptFunctions: Array.isArray(data) ? data : null });
        }
      )
      .catch(function (error) {
        set({
          conceptFunctions: null,
          errorMessage: error?.response?.data,
          // ? `${error.response.data.message}: ${error.response.data.data}`
          // : "",
        });
        //alert(error?.response?.data);
        console.log(error.toJSON());
      });
  },
});
