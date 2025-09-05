import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";

class Service {
  service: AxiosInstance;
  constructor() {
    let accessToken = localStorage.getItem("accessToken");
    let service = axios.create({
      headers: {
        "Content-Type": "application/json",
        Authorization: accessToken ? `Bearer ${accessToken}` : "",
      },
    });
    service.interceptors.response.use(this.handleSuccess, this.handleError);
    this.service = service;
  }

  handleSuccess(response: AxiosResponse) {
    return response;
  }

  handleError = (error: AxiosError) => {
    return Promise.reject(error);
  };

  get(path: string, callback: Function) {
    return this.service.get(path).then((response) => callback(response.status, response.data));
  }

  patch(path: string, payload: object, callback: Function) {
    return this.service
      .request({
        method: "PATCH",
        url: path,
        responseType: "json",
        data: payload,
      })
      .then((response) => callback(response.status, response.data));
  }

  post(path: string, payload: object, callback: Function) {
    return this.service
      .request({
        method: "POST",
        url: path,
        responseType: "json",
        data: payload,
      })
      .then((response) => callback(response.status, response.data, response));
  }
  delete(path: string, payload: object, callback: Function) {
    return this.service
      .request({
        method: "DELETE",
        url: path,
        responseType: "json",
        data: payload,
      })
      .then((response) => callback(response.status, response.data));
  }
}

export const apiService = new Service();
