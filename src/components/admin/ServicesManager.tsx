import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Sparkles, Plus, Pencil, Trash2, Camera } from "lucide-react";
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
  uploadServiceImage,
} from "@/services/api/serviceAPI";
import {
  getCategoriesWithServices,
  createCategory,
  linkServiceToCategory,
  unlinkServiceFromCategory,
} from "@/services/api/categoriesAPI";
import type { Service, CategoryWithServices } from "@/services/api/types";
import ImageWithFallback from "@/components/ImageWithFallback";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const NEW_CATEGORY = "__new__";

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (typeof data === "string" && data) return data;
    if (data?.title) return data.title;
    if (data?.error) return data.error;
  }
  return fallback;
}

// API:et serialiserar duration som .NET TimeSpan ("HH:mm:ss", ev. "d.HH:mm:ss").
function minutesToTimeSpan(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

function timeSpanToMinutes(duration: string): number {
  const [dayPart, timePart] = duration.includes(".")
    ? duration.split(".", 2)
    : ["0", duration];
  const [h = "0", m = "0"] = timePart.split(":");
  return Number(dayPart) * 1440 + Number(h) * 60 + Number(m);
}

const serviceSchema = z
  .object({
    name: z
      .string()
      .min(2, "Ange minst 2 tecken")
      .max(50, "Högst 50 tecken"),
    description: z.string().max(500, "Högst 500 tecken"),
    durationMinutes: z.coerce
      .number({ invalid_type_error: "Ange längd i minuter" })
      .int("Ange hela minuter")
      .positive("Måste vara minst 1 minut")
      .max(1439, "Högst 23 h 59 min"),
    price: z.coerce
      .number({ invalid_type_error: "Ange ett pris" })
      .positive("Priset måste vara större än 0"),
    categoryId: z.string(),
    newCategoryName: z.string(),
  })
  .refine(
    (v) => v.categoryId !== NEW_CATEGORY || v.newCategoryName.trim().length >= 2,
    { message: "Ange namn på den nya kategorin", path: ["newCategoryName"] }
  );

type ServiceFormValues = z.infer<typeof serviceSchema>;

const emptyForm: ServiceFormValues = {
  name: "",
  description: "",
  durationMinutes: 30,
  price: 500,
  categoryId: "",
  newCategoryName: "",
};

/**
 * Adminsektion för behandlingar: lista, skapa/redigera (inkl. bild och
 * kategori) och ta bort. Kategori sätts via separata länk-endpoints
 * (ServiceDTO saknar CategoryId), och listan hämtas om efter varje mutation
 * eftersom POST/PUT-svaren inte innehåller användbara bild-URL:er.
 */
const ServicesManager: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<CategoryWithServices[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: emptyForm,
  });
  const errors = form.formState.errors;
  const selectedCategoryId = form.watch("categoryId");

  const categoryByServiceId = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const cat of categories) {
      for (const svc of cat.services) {
        map.set(svc.id, { id: cat.id, name: cat.name });
      }
    }
    return map;
  }, [categories]);

  const loadData = useCallback(async () => {
    const [svcs, cats] = await Promise.all([
      getAllServices(),
      getCategoriesWithServices(),
    ]);
    setServices(svcs);
    setCategories(cats);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Frigör objekt-URL:en när förhandsvisningen byts eller stängs
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const openCreate = () => {
    form.reset(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setEditing("new");
  };

  const openEdit = (service: Service) => {
    form.reset({
      name: service.name,
      description: service.description,
      durationMinutes: timeSpanToMinutes(service.duration),
      price: service.price,
      categoryId: categoryByServiceId.get(service.id)?.id ?? "",
      newCategoryName: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setEditing(service);
  };

  const closeModal = () => {
    if (saving) return;
    setEditing(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const onImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // tillåt att samma fil väljs igen
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Bilden måste vara JPG, PNG eller WebP");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Bilden får vara högst 5 MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  /** Löser valt kategori-id; skapar först den nya kategorin vid behov. */
  const resolveCategoryId = async (
    values: ServiceFormValues
  ): Promise<string | null> => {
    if (values.categoryId === NEW_CATEGORY) {
      const name = values.newCategoryName.trim();
      await createCategory(name);
      const cats = await getCategoriesWithServices();
      setCategories(cats);
      const created = cats.find(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      );
      if (!created) throw new Error("Kunde inte hitta den nya kategorin");
      return created.id;
    }
    return values.categoryId || null;
  };

  const onSubmit = async (values: ServiceFormValues) => {
    setSaving(true);
    try {
      const input = {
        name: values.name.trim(),
        description: values.description.trim(),
        duration: minutesToTimeSpan(values.durationMinutes),
        price: values.price,
        imageUrl: "", // ignoreras av API:et — bilden laddas upp separat
      };
      const categoryId = await resolveCategoryId(values);

      if (editing === "new") {
        const created = await createService(input);
        // Behandlingen finns nu i databasen. Växla till redigeringsläge direkt så
        // att om bild-/kategori-stegen nedan fallerar, ett nytt försök UPPDATERAR
        // den befintliga raden istället för att skapa en dubblett.
        setEditing(created);
        if (imageFile) await uploadServiceImage(created.id, imageFile);
        if (categoryId) await linkServiceToCategory(categoryId, created.id);
        toast.success("Behandlingen har skapats");
      } else if (editing) {
        await updateService(editing.id, input);
        const previousCategoryId =
          categoryByServiceId.get(editing.id)?.id ?? null;
        if (categoryId !== previousCategoryId) {
          if (previousCategoryId)
            await unlinkServiceFromCategory(previousCategoryId, editing.id);
          if (categoryId)
            await linkServiceToCategory(categoryId, editing.id);
        }
        if (imageFile) await uploadServiceImage(editing.id, imageFile);
        toast.success("Behandlingen har uppdaterats");
      }

      setEditing(null);
      setImageFile(null);
      setImagePreview(null);
      await loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Kunde inte spara behandlingen"));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteService(deleteTarget.id);
      toast.success("Behandlingen har tagits bort");
      setDeleteTarget(null);
      await loadData();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Kunde inte ta bort behandlingen")
      );
    } finally {
      setDeleting(false);
    }
  };

  const editingImageUrl =
    imagePreview ??
    (editing && editing !== "new" ? editing.imageUrl : undefined);

  return (
    <section className="card bg-base-100 border border-base-300 shadow-sm rounded-xl">
      <div className="card-body">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="card-title">
            <Sparkles className="h-5 w-5 text-primary" />
            Hantera behandlingar
          </h2>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Ny behandling
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : services.length === 0 ? (
          <p className="mt-4 text-sm text-base-content/60">
            Inga behandlingar ännu. Skapa den första med "Ny behandling".
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th className="w-20">Bild</th>
                  <th>Behandling</th>
                  <th>Kategori</th>
                  <th className="text-right">Längd</th>
                  <th className="text-right">Pris</th>
                  <th className="w-24 text-right">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="w-16 h-10 rounded-md overflow-hidden">
                        <ImageWithFallback
                          src={s.imageUrl}
                          alt={s.name}
                          className="w-full h-full object-cover"
                          fallbackText=""
                        />
                      </div>
                    </td>
                    <td>
                      <div className="font-medium">{s.name}</div>
                      {s.description && (
                        <div className="text-xs text-base-content/60 line-clamp-1 max-w-xs">
                          {s.description}
                        </div>
                      )}
                    </td>
                    <td>
                      {categoryByServiceId.get(s.id) ? (
                        <span className="badge badge-ghost badge-sm">
                          {categoryByServiceId.get(s.id)!.name}
                        </span>
                      ) : (
                        <span className="text-xs text-base-content/40">–</span>
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {timeSpanToMinutes(s.duration)} min
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {s.price} kr
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => openEdit(s)}
                          aria-label={`Redigera ${s.name}`}
                          title="Redigera"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => setDeleteTarget(s)}
                          aria-label={`Ta bort ${s.name}`}
                          title="Ta bort"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Skapa/redigera-modal */}
      {editing && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg">
              {editing === "new" ? "Ny behandling" : `Redigera ${editing.name}`}
            </h3>

            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-3">
              <div className="form-control">
                <label className="label py-1" htmlFor="svc-name">
                  <span className="label-text">Namn</span>
                </label>
                <input
                  id="svc-name"
                  type="text"
                  className="input input-bordered w-full"
                  {...form.register("name")}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-error">{errors.name.message}</p>
                )}
              </div>

              <div className="form-control">
                <label className="label py-1" htmlFor="svc-desc">
                  <span className="label-text">Beskrivning</span>
                </label>
                <textarea
                  id="svc-desc"
                  className="textarea textarea-bordered w-full"
                  rows={3}
                  {...form.register("description")}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-error">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-1" htmlFor="svc-duration">
                    <span className="label-text">Längd (minuter)</span>
                  </label>
                  <input
                    id="svc-duration"
                    type="number"
                    min={1}
                    className="input input-bordered w-full"
                    {...form.register("durationMinutes")}
                  />
                  {errors.durationMinutes && (
                    <p className="mt-1 text-sm text-error">
                      {errors.durationMinutes.message}
                    </p>
                  )}
                </div>
                <div className="form-control">
                  <label className="label py-1" htmlFor="svc-price">
                    <span className="label-text">Pris (kr)</span>
                  </label>
                  <input
                    id="svc-price"
                    type="number"
                    min={1}
                    step="0.01"
                    className="input input-bordered w-full"
                    {...form.register("price")}
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-error">
                      {errors.price.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="form-control">
                <label className="label py-1" htmlFor="svc-category">
                  <span className="label-text">Kategori</span>
                </label>
                <select
                  id="svc-category"
                  className="select select-bordered w-full"
                  {...form.register("categoryId")}
                >
                  <option value="">Ingen kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value={NEW_CATEGORY}>+ Ny kategori…</option>
                </select>
              </div>

              {selectedCategoryId === NEW_CATEGORY && (
                <div className="form-control">
                  <label className="label py-1" htmlFor="svc-new-category">
                    <span className="label-text">Namn på ny kategori</span>
                  </label>
                  <input
                    id="svc-new-category"
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="t.ex. Fillers"
                    {...form.register("newCategoryName")}
                  />
                  {errors.newCategoryName && (
                    <p className="mt-1 text-sm text-error">
                      {errors.newCategoryName.message}
                    </p>
                  )}
                </div>
              )}

              <div className="form-control">
                <span className="label py-1 label-text">Bild</span>
                <div className="flex items-center gap-3">
                  <div className="w-28 h-[70px] rounded-md overflow-hidden shrink-0">
                    <ImageWithFallback
                      src={editingImageUrl}
                      alt="Förhandsvisning"
                      className="w-full h-full object-cover"
                      fallbackText="Ingen bild"
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                  >
                    <Camera className="h-4 w-4" />
                    {imageFile ? imageFile.name : "Välj bild…"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={onImageSelected}
                  />
                </div>
                <p className="mt-1 text-xs text-base-content/50">
                  JPG, PNG eller WebP, högst 5 MB.
                </p>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Avbryt
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving && <span className="loading loading-spinner loading-xs" />}
                  {editing === "new" ? "Skapa" : "Spara"}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/30" onClick={closeModal} />
        </dialog>
      )}

      {/* Ta bort-bekräftelse */}
      {deleteTarget && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Ta bort behandling</h3>
            <p className="py-4">
              Vill du ta bort <strong>{deleteTarget.name}</strong>? Detta går
              inte att ångra. Behandlingar med bokningar kan inte tas bort.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Avbryt
              </button>
              <button className="btn btn-error" onClick={onDelete} disabled={deleting}>
                {deleting && <span className="loading loading-spinner loading-xs" />}
                Ta bort
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/30" onClick={() => !deleting && setDeleteTarget(null)} />
        </dialog>
      )}
    </section>
  );
};

export default ServicesManager;
