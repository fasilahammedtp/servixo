import { api } from "./api";

export async function getUserProfile(userId: string) {
  const res = await api.get(`/users/${userId}`);
  return res.data.user;
}

export async function updateUserProfile(
  userId: string,
  data: { name?: string; phone?: string; profilePhoto?: string }
) {
  const res = await api.put(`/users/${userId}`, data);
  return res.data.user;
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("images", file);

  const res = await api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  if (res.data.urls && res.data.urls.length > 0) {
    return res.data.urls[0];
  }
  throw new Error("Failed to upload image");
}

export async function uploadProfilePhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await api.patch("/users/profile-photo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data.profilePhoto || res.data.user?.profilePhoto;
}

