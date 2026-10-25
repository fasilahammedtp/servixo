import { useState, useRef, ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Briefcase,
  Check,
  CheckCircle2,
  Droplets,
  Edit3,
  Eye,
  EyeOff,
  Home as HomeIcon,
  Image as ImageIcon,
  Layers,
  Loader2,
  MoreHorizontal,
  Paintbrush,
  Plus,
  Shield,
  Sparkles,
  UploadCloud,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
} from "../../services/adminService";
import { uploadImages } from "../../services/jobService";
import { Category } from "../../types";

import {
  getCategoryIcon,
  resolveCategoryPhoto,
} from "../../utils/categoryTheme";

const ICON_OPTIONS = [
  { label: "Briefcase", value: "Briefcase", icon: Briefcase },
  { label: "Plumbing / Water", value: "Droplets", icon: Droplets },
  { label: "Electrical / Power", value: "Zap", icon: Zap },
  { label: "Cleaning / Home", value: "Home", icon: HomeIcon },
  { label: "Painting", value: "Paintbrush", icon: Paintbrush },
  { label: "Repair / Tools", value: "Wrench", icon: Wrench },
  { label: "Sparkles / Beauty", value: "Sparkles", icon: Sparkles },
  { label: "Security / Shield", value: "Shield", icon: Shield },
  { label: "Other / General", value: "MoreHorizontal", icon: MoreHorizontal },
];

export function CategoryManager() {
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmToggleCategory, setConfirmToggleCategory] = useState<Category | null>(null);

  // Form states for Add Category
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("Briefcase");
  const [newDescription, setNewDescription] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string>("");
  const [addFormError, setAddFormError] = useState("");
  const [isUploadingAdd, setIsUploadingAdd] = useState(false);

  // Form states for Edit Category
  const [editIcon, setEditIcon] = useState("Briefcase");
  const [editDescription, setEditDescription] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>("");
  const [editFormError, setEditFormError] = useState("");
  const [isUploadingEdit, setIsUploadingEdit] = useState(false);

  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: categories = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["adminCategories"],
    queryFn: getAdminCategories,
  });

  const createMutation = useMutation({
    mutationFn: createAdminCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      resetAddForm();
      setIsAddModalOpen(false);
    },
    onError: (err: any) => {
      setAddFormError(
        err?.response?.data?.message || "Failed to create category. Please try again."
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAdminCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingCategory(null);
      setConfirmToggleCategory(null);
      resetEditForm();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Failed to update category.";
      if (editingCategory) {
        setEditFormError(msg);
      } else {
        alert(msg);
      }
    },
  });

  function resetAddForm() {
    setNewName("");
    setNewIcon("Briefcase");
    setNewDescription("");
    setNewImageFile(null);
    setNewImagePreview("");
    setAddFormError("");
    setIsUploadingAdd(false);
    if (addFileInputRef.current) addFileInputRef.current.value = "";
  }

  function resetEditForm() {
    setEditIcon("Briefcase");
    setEditDescription("");
    setEditImageFile(null);
    setEditImagePreview("");
    setEditFormError("");
    setIsUploadingEdit(false);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  }

  function handleAddFileSelect(e: ChangeEvent<HTMLInputElement>) {
    setAddFormError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAddFormError("Only image files are allowed (PNG, JPG, JPEG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAddFormError("File size exceeds 5 MB limit. Please select a smaller image.");
      return;
    }

    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  }

  function handleEditFileSelect(e: ChangeEvent<HTMLInputElement>) {
    setEditFormError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setEditFormError("Only image files are allowed (PNG, JPG, JPEG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setEditFormError("File size exceeds 5 MB limit. Please select a smaller image.");
      return;
    }

    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  }

  async function handleAddCategorySubmit() {
    setAddFormError("");
    const trimmed = newName.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 40) {
      setAddFormError("Category name must be between 2 and 40 characters.");
      return;
    }

    if (!newImageFile) {
      setAddFormError("A category photo is required for new categories.");
      return;
    }

    try {
      setIsUploadingAdd(true);
      const [uploadedUrl] = await uploadImages([newImageFile]);
      if (!uploadedUrl) {
        throw new Error("Failed to upload image. Please try again.");
      }

      createMutation.mutate({
        name: trimmed,
        icon: newIcon,
        image: uploadedUrl,
        description: newDescription.trim() || undefined,
      });
    } catch (err: any) {
      setAddFormError(err?.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploadingAdd(false);
    }
  }

  function openEditModal(category: Category) {
    setEditingCategory(category);
    setEditIcon(category.icon || "Briefcase");
    setEditDescription(category.description || "");
    setEditImagePreview(category.image || "");
    setEditImageFile(null);
    setEditFormError("");
  }

  async function handleEditCategorySubmit() {
    if (!editingCategory) return;
    setEditFormError("");

    try {
      let finalImageUrl = editingCategory.image;

      if (editImageFile) {
        setIsUploadingEdit(true);
        const [uploadedUrl] = await uploadImages([editImageFile]);
        if (!uploadedUrl) {
          throw new Error("Failed to upload new image. Please try again.");
        }
        finalImageUrl = uploadedUrl;
      }

      updateMutation.mutate({
        id: editingCategory._id,
        data: {
          icon: editIcon,
          image: finalImageUrl,
          description: editDescription.trim() || undefined,
        },
      });
    } catch (err: any) {
      setEditFormError(err?.message || "Failed to update category.");
    } finally {
      setIsUploadingEdit(false);
    }
  }

  return (
    <section className="mb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-navy dark:text-white">Categories</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage marketplace services, category photos, and visibility.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            resetAddForm();
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-accent dark:hover:bg-amber-400 text-white dark:text-navy text-xs font-bold px-4 py-2.5 min-h-[42px] rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2 text-accent" />
          Loading categories…
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
          {(error as any)?.response?.data?.message || "Could not load categories."}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && categories.length === 0 && (
        <div className="bg-white dark:bg-[#132320] border border-[#EBE6DA] dark:border-gray-800 rounded-2xl px-6 py-12 text-center">
          <p className="text-navy dark:text-white font-medium">No categories found</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create your first service category using the "Add Category" button.
          </p>
        </div>
      )}

      {/* Categories Grid / Cards */}
      {!isLoading && !isError && categories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {categories.map((cat) => {
            const isOther = cat.name.trim().toLowerCase() === "other";
            const { imageUrl, isDefault } = resolveCategoryPhoto(cat, 400);

            return (
              <div
                key={cat._id}
                className="bg-white dark:bg-[#132320] border border-[#EBE6DA] dark:border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition shadow-xs hover:border-gray-300 dark:hover:border-gray-700"
              >
                <div>
                  {/* Top Thumbnail & Badges */}
                  <div className="relative h-36 rounded-xl overflow-hidden mb-3 bg-gray-100 dark:bg-[#0c1917] border border-[#EBE6DA]/60 dark:border-gray-800/80 flex items-center justify-center">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-navy to-[#132823] flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:16px_16px]" />
                        <div className="opacity-20 transform scale-[2.2] text-white pointer-events-none">
                          {getCategoryIcon(cat.icon || cat.name, "w-10 h-10")}
                        </div>
                      </div>
                    )}

                    {/* Default photo label */}
                    {isDefault && (
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/75 text-gray-200 backdrop-blur-md border border-white/10 shadow-xs">
                          Default photo
                        </span>
                      </div>
                    )}

                    {/* Active / Hidden badge */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      {cat.isActive !== false ? (
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white backdrop-blur-md shadow-xs flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-600/90 text-white backdrop-blur-md shadow-xs flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Hidden
                        </span>
                      )}
                    </div>

                    {/* Icon pill */}
                    <div className="absolute bottom-2.5 left-2.5 w-8 h-8 rounded-lg bg-navy/80 text-white backdrop-blur-md flex items-center justify-center shadow-xs z-10">
                      {getCategoryIcon(cat.icon || cat.name, "w-4 h-4")}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold text-navy dark:text-white text-base truncate">
                      {cat.name}
                    </h3>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-3">
                    {cat.description || (isOther ? "Custom or specialized requests" : "Standard platform service")}
                  </p>
                </div>

                {/* Metrics & Actions */}
                <div className="pt-3 border-t border-[#EBE6DA]/60 dark:border-gray-800/60 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    <span className="text-navy dark:text-white font-bold">{cat.jobCount ?? 0}</span>{" "}
                    {(cat.jobCount ?? 0) === 1 ? "job" : "jobs"} ·{" "}
                    <span className="text-navy dark:text-white font-bold">{cat.workerCount ?? 0}</span>{" "}
                    {(cat.workerCount ?? 0) === 1 ? "worker" : "workers"}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 text-gray-500 hover:text-navy dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                      title="Edit Category"
                      aria-label={`Edit ${cat.name}`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {isOther ? (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40"
                        title="The 'Other' category is protected and cannot be hidden"
                      >
                        <Shield className="w-3 h-3" />
                        Protected
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmToggleCategory(cat)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          cat.isActive !== false
                            ? "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        }`}
                      >
                        {cat.isActive !== false ? "Hide" : "Show"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#132320] border border-[#EBE6DA] dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-navy dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-accent" /> Add New Category
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-navy dark:hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addFormError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-xl p-3 border border-red-200 dark:border-red-800/40">
                {addFormError}
              </div>
            )}

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-navy dark:text-white uppercase tracking-wider mb-1.5">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Appliance Repair (2-40 chars)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#0c1917] border border-[#EBE6DA] dark:border-gray-800 rounded-xl text-navy dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-xs font-bold text-navy dark:text-white uppercase tracking-wider mb-1.5">
                  Category Icon
                </label>
                <select
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#0c1917] border border-[#EBE6DA] dark:border-gray-800 rounded-xl text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Upload with live preview */}
              <div>
                <label className="block text-xs font-bold text-navy dark:text-white uppercase tracking-wider mb-1.5">
                  Category Photo <span className="text-red-500">*</span> (Max 5 MB)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  ref={addFileInputRef}
                  onChange={handleAddFileSelect}
                  className="hidden"
                />

                {newImagePreview ? (
                  <div className="relative h-44 rounded-xl overflow-hidden border border-[#EBE6DA] dark:border-gray-800 group">
                    <img
                      src={newImagePreview}
                      alt="Category preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => addFileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Change Photo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => addFileInputRef.current?.click()}
                    className="w-full h-36 border-2 border-dashed border-[#EBE6DA] dark:border-gray-800 hover:border-accent dark:hover:border-accent rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-navy dark:hover:text-white transition"
                  >
                    <UploadCloud className="w-8 h-8 mb-2 text-accent" />
                    <span className="text-xs font-semibold">Click to upload category photo</span>
                    <span className="text-[10px] text-gray-400 mt-1">PNG, JPG, WEBP up to 5 MB</span>
                  </button>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-navy dark:text-white uppercase tracking-wider mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description of this service category..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#0c1917] border border-[#EBE6DA] dark:border-gray-800 rounded-xl text-navy dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#EBE6DA]/60 dark:border-gray-800/60">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isUploadingAdd || createMutation.isPending}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCategorySubmit}
                disabled={isUploadingAdd || createMutation.isPending}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-accent dark:hover:bg-amber-400 dark:text-navy transition shadow-xs disabled:opacity-60"
              >
                {isUploadingAdd || createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isUploadingAdd ? "Uploading Photo…" : "Saving Category…"}</span>
                  </>
                ) : (
                  <span>Create Category</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CATEGORY MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#132320] border border-[#EBE6DA] dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-navy dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-accent" /> Edit Category: {editingCategory.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="p-1.5 text-gray-400 hover:text-navy dark:hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editFormError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-xl p-3 border border-red-200 dark:border-red-800/40">
                {editFormError}
              </div>
            )}

            <div className="space-y-4">
              {/* Category Name - Fixed / Read Only */}
              <div>
                <label className="block text-xs font-bold text-navy dark:text-white uppercase tracking-wider mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  disabled
                  value={editingCategory.name}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-100 dark:bg-[#0c1917]/60 border border-[#EBE6DA] dark:border-gray-800 rounded-xl text-gray-500 cursor-not-allowed"
                />
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                  Name cannot be renamed because worker skills are linked to this name.
                </p>
              </div>

              {/* Icon Choice */}
              <div>
                <label className="block text-xs font-bold text-navy dark:text-white uppercase tracking-wider mb-1.5">
                  Category Icon
                </label>
                <select
                  value={editIcon}
                  onChange={(e) => setEditIcon(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#0c1917] border border-[#EBE6DA] dark:border-gray-800 rounded-xl text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Replace Image with Preview */}
              <div>
                <label className="block text-xs font-bold text-navy dark:text-white uppercase tracking-wider mb-1.5">
                  Replace Photo (Optional, Max 5 MB)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  ref={editFileInputRef}
                  onChange={handleEditFileSelect}
                  className="hidden"
                />

                {editImagePreview ? (
                  <div className="relative h-44 rounded-xl overflow-hidden border border-[#EBE6DA] dark:border-gray-800 group">
                    <img
                      src={editImagePreview}
                      alt="Category preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Choose Different Photo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-[#EBE6DA] dark:border-gray-800 hover:border-accent dark:hover:border-accent rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-navy dark:hover:text-white transition"
                  >
                    <UploadCloud className="w-7 h-7 mb-1 text-accent" />
                    <span className="text-xs font-semibold">Upload Photo</span>
                  </button>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-navy dark:text-white uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#0c1917] border border-[#EBE6DA] dark:border-gray-800 rounded-xl text-navy dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#EBE6DA]/60 dark:border-gray-800/60">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                disabled={isUploadingEdit || updateMutation.isPending}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditCategorySubmit}
                disabled={isUploadingEdit || updateMutation.isPending}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-accent dark:hover:bg-amber-400 dark:text-navy transition shadow-xs disabled:opacity-60"
              >
                {isUploadingEdit || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes…</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIDE / SHOW CONFIRMATION MODAL (Matching Block User Style) */}
      {confirmToggleCategory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#132320] border border-[#EBE6DA] dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center gap-3.5 mb-4">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmToggleCategory.isActive !== false
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                }`}
              >
                {confirmToggleCategory.isActive !== false ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy dark:text-white">
                  {confirmToggleCategory.isActive !== false
                    ? "Hide Category from Public"
                    : "Make Category Active"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {confirmToggleCategory.name}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              {confirmToggleCategory.isActive !== false
                ? `Are you sure you want to hide "${confirmToggleCategory.name}"? Hidden categories won't appear on the Home or Services pages and cannot accept new job bookings. Existing jobs in this category remain unaffected.`
                : `Are you sure you want to unhide "${confirmToggleCategory.name}"? This category will immediately be visible on Home, Services, and open for customer bookings.`}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmToggleCategory(null)}
                disabled={updateMutation.isPending}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updateMutation.isPending}
                onClick={() => {
                  updateMutation.mutate({
                    id: confirmToggleCategory._id,
                    data: { isActive: confirmToggleCategory.isActive === false },
                  });
                }}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition min-h-[40px] shadow-sm ${
                  confirmToggleCategory.isActive !== false
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {confirmToggleCategory.isActive !== false ? "Confirm Hide" : "Confirm Show"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
