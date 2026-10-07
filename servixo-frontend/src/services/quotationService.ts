import { api } from "./api";
import { Quotation } from "../types";

export interface CreateQuotationPayload {
  jobId: string;
  price: number;
  message?: string;
  etaMinutes?: number;
}

export const createQuotation = async (payload: CreateQuotationPayload): Promise<Quotation> => {
  const response = await api.post<{ quotation: Quotation; message: string }>("/quotations", payload);
  return response.data.quotation;
};

export const getJobQuotations = async (jobId: string): Promise<Quotation[]> => {
  const response = await api.get<{ quotations: Quotation[] }>(`/quotations/job/${jobId}`);
  return response.data.quotations;
};

export const getMyQuotations = async (): Promise<Quotation[]> => {
  const response = await api.get<{ quotations: Quotation[] }>("/quotations/my-quotes");
  return response.data.quotations;
};

export const acceptQuotation = async (quotationId: string): Promise<{ quotation: Quotation; job: any }> => {
  const response = await api.patch<{ quotation: Quotation; job: any; message: string }>(
    `/quotations/${quotationId}/accept`
  );
  return response.data;
};
