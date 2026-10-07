import { api } from "./api";

export interface Review {
  _id: string;
  job: string;
  customer: {
    _id: string;
    name: string;
    profilePhoto?: string;
  };
  worker: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export const createReview = async (data: {
  jobId: string;
  rating: number;
  comment?: string;
}): Promise<{ message: string; review: Review }> => {
  const res = await api.post("/reviews", data);
  return res.data;
};

export const getWorkerReviews = async (workerId: string): Promise<Review[]> => {
  const res = await api.get(`/reviews/worker/${workerId}`);
  return res.data.reviews;
};

export const getJobReview = async (jobId: string): Promise<Review | null> => {
  const res = await api.get(`/reviews/job/${jobId}`);
  return res.data.review;
};
