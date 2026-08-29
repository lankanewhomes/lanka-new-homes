"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { ConstructionCompany, Developer, KeyFeatureCategory, KeyFeatureItem, Land, LandPlot, LandSellerType, NearbyPlace } from "@/types";
import { Button } from "@/components/ui/button";
import { Field, featurePresetsForCategory, normalizeUnitFeatures, toFeatureCategorySlug } from "@/components/dashboard/components";
import {
  sriLankaCitiesByDistrict,
  sriLankaDistrictsByProvince,
  sriLankaProvinces,
} from "@/data/sri-lanka-market-geo";

const steps = ["Basic Info", "Land Details", "Payment Plan", "Facilities", "Key Features", "Plots", "Gallery", "Neighborhood", "Contact", "SEO", "Publish"];

const nearbyCategoryOptions = ["School", "Hospital", "Shopping", "Restaurant", "Transport", "Landmark"];

const facilityOptions = ["Wide Road", "20ft Wide Road", "Corner Plot", "Level Ground", "Fenced", "Near Highway", "City Area", "Gated Community", "Water Access", "Electricity Pole Nearby", "Electricity", "Tap Water", "Water", "School", "Beachfront", "Sea View"];

const trustBadgeOptions = ["Easy Payment Plan", "Fast Legal Services", "Zero Documentation", "Ideal for Commercial Use", "Zero Percent Interest"];

export function LandWizard({
  initialLand,
  developers,
  constructionCompanies,
}: {
  initialLand?: Land;
  developers: Developer[];
  constructionCompanies: ConstructionCompany[];
}) {
  const [step, setStep] = useState(0);
  const stepVisible = (index: number) => (step === index ? "" : "hidden");

  const titleRef = useRef<HTMLInputElement>(null);
  const [sellerType, setSellerType] = useState<LandSellerType>(initialLand?.sellerType ?? "developer");
  const [sellerSlug, setSellerSlug] = useState(initialLand?.sellerSlug ?? "");
  const builderNameRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Land["status"]>(initialLand?.status ?? "Available");
  const [isFeatured, setIsFeatured] = useState(Boolean(initialLand?.isFeatured));

  const addressRef = useRef<HTMLInputElement>(null);
  const [province, setProvince] = useState(initialLand?.province ?? "");
  const [district, setDistrict] = useState(initialLand?.district ?? "");
  const [city, setCity] = useState(initialLand?.city ?? "");
  const districtOptions = province ? Array.from(new Set(sriLankaDistrictsByProvince[province] ?? [])) : [];
  const cityOptions = district ? Array.from(new Set(sriLankaCitiesByDistrict[district] ?? [])) : [];

  const landSizePerchesRef = useRef<HTMLInputElement>(null);
  const landSizeAcresRef = useRef<HTMLInputElement>(null);
  const priceLkrRef = useRef<HTMLInputElement>(null);
  const pricePerPerchMinRef = useRef<HTMLInputElement>(null);
  const pricePerPerchMaxRef = useRef<HTMLInputElement>(null);
  const [landUse, setLandUse] = useState(initialLand?.landUse ?? "Residential");
  const landTypeRef = useRef<HTMLInputElement>(null);
  const landShapeRef = useRef<HTMLInputElement>(null);
  const roadAccessRef = useRef<HTMLInputElement>(null);
  const roadWidthRef = useRef<HTMLInputElement>(null);
  const [electricity, setElectricity] = useState(initialLand?.electricity ?? "");
  const [water, setWater] = useState(initialLand?.water ?? "");
  const titleTypeRef = useRef<HTMLInputElement>(null);
  const surveyPlanStatusRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [paymentPlanItems, setPaymentPlanItems] = useState<string[]>(initialLand?.paymentPlanItems?.length ? initialLand.paymentPlanItems : [""]);
  const addPaymentPlanItem = () => setPaymentPlanItems((current) => [...current, ""]);
  const updatePaymentPlanItem = (index: number, value: string) => setPaymentPlanItems((current) => current.map((item, i) => (i === index ? value : item)));
  const removePaymentPlanItem = (index: number) => setPaymentPlanItems((current) => current.filter((_, i) => i !== index));

  const [facilities, setFacilities] = useState<string[]>(initialLand?.facilities ?? []);
  const toggleFacility = (facility: string) => setFacilities((current) => (current.includes(facility) ? current.filter((item) => item !== facility) : [...current, facility]));
  const [badges, setBadges] = useState<string[]>(initialLand?.badges ?? []);
  const toggleBadge = (badge: string) => setBadges((current) => (current.includes(badge) ? current.filter((item) => item !== badge) : [...current, badge]));
  const [customFacility, setCustomFacility] = useState("");
  const addCustomFacility = () => {
    const value = customFacility.trim();
    if (value && !facilities.includes(value)) setFacilities((current) => [...current, value]);
    setCustomFacility("");
  };
  const removeFacility = (facility: string) => setFacilities((current) => current.filter((item) => item !== facility));

  const [featureCategories, setFeatureCategories] = useState<KeyFeatureCategory[]>(() => normalizeUnitFeatures(initialLand?.unitFeatures));
  const [activeFeatureCategoryIndex, setActiveFeatureCategoryIndex] = useState(0);
  const [newFeatureCategoryName, setNewFeatureCategoryName] = useState("");

  const addFeatureCategory = () => {
    const label = newFeatureCategoryName.trim();
    if (!label) return;
    const key = toFeatureCategorySlug(label) || `category-${featureCategories.length}`;
    setFeatureCategories((current) => [...current, { key, label, items: [] }]);
    setActiveFeatureCategoryIndex(featureCategories.length);
    setNewFeatureCategoryName("");
  };

  const removeFeatureCategory = (categoryIndex: number) => {
    setFeatureCategories((current) => current.filter((_, index) => index !== categoryIndex));
    setActiveFeatureCategoryIndex((current) => Math.max(0, Math.min(current, featureCategories.length - 2)));
  };

  const addFeatureItem = (categoryIndex: number) => {
    setFeatureCategories((current) =>
      current.map((category, index) => {
        if (index !== categoryIndex) return category;
        const presetFields = Object.keys(featurePresetsForCategory(category.key));
        const usedFields = new Set(category.items.map((item) => item.field));
        const nextField = presetFields.find((field) => !usedFields.has(field)) ?? "";
        return { ...category, items: [...category.items, { field: nextField, value: "" }] };
      })
    );
  };

  const updateFeatureItem = (categoryIndex: number, itemIndex: number, patch: Partial<KeyFeatureItem>) => {
    setFeatureCategories((current) =>
      current.map((category, index) =>
        index !== categoryIndex
          ? category
          : { ...category, items: category.items.map((item, i) => (i === itemIndex ? { ...item, ...patch } : item)) }
      )
    );
  };

  const removeFeatureItem = (categoryIndex: number, itemIndex: number) => {
    setFeatureCategories((current) =>
      current.map((category, index) =>
        index !== categoryIndex ? category : { ...category, items: category.items.filter((_, i) => i !== itemIndex) }
      )
    );
  };

  const [plots, setPlots] = useState<{ id: string; name: string; sizePerches: string; priceLkr: string; status: LandPlot["status"]; image: string }[]>(
    initialLand?.plots?.map((plot) => ({ id: plot.id, name: plot.name, sizePerches: String(plot.sizePerches), priceLkr: String(plot.priceLkr), status: plot.status, image: plot.image ?? "" })) ?? []
  );
  const addPlot = () => setPlots((current) => [...current, { id: `plot-${current.length + 1}`, name: "", sizePerches: "", priceLkr: "", status: "Available", image: "" }]);
  const updatePlot = (index: number, patch: Partial<{ name: string; sizePerches: string; priceLkr: string; status: LandPlot["status"]; image: string }>) =>
    setPlots((current) => current.map((plot, i) => (i === index ? { ...plot, ...patch } : plot)));
  const removePlot = (index: number) => setPlots((current) => current.filter((_, i) => i !== index));

  const heroImageRef = useRef<HTMLInputElement>(null);
  const [gallery, setGallery] = useState<{ label: string; image: string }[]>(initialLand?.gallery ?? []);
  const addGalleryImage = () => setGallery((current) => [...current, { label: "", image: "" }]);
  const updateGalleryImage = (index: number, field: "label" | "image", value: string) =>
    setGallery((current) => current.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)));
  const removeGalleryImage = (index: number) => setGallery((current) => current.filter((_, i) => i !== index));

  const [blockPlanImages, setBlockPlanImages] = useState<{ label: string; image: string }[]>(initialLand?.blockPlanImages ?? []);
  const addBlockPlanImage = () => setBlockPlanImages((current) => [...current, { label: "", image: "" }]);
  const updateBlockPlanImage = (index: number, field: "label" | "image", value: string) =>
    setBlockPlanImages((current) => current.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)));
  const removeBlockPlanImage = (index: number) => setBlockPlanImages((current) => current.filter((_, i) => i !== index));

  const [roadMapImages, setRoadMapImages] = useState<{ label: string; image: string }[]>(initialLand?.roadMapImages ?? []);
  const addRoadMapImage = () => setRoadMapImages((current) => [...current, { label: "", image: "" }]);
  const updateRoadMapImage = (index: number, field: "label" | "image", value: string) =>
    setRoadMapImages((current) => current.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)));
  const removeRoadMapImage = (index: number) => setRoadMapImages((current) => current.filter((_, i) => i !== index));

  const [videos, setVideos] = useState<{ label: string; url: string }[]>(initialLand?.videos ?? []);
  const addVideo = () => setVideos((current) => [...current, { label: "", url: "" }]);
  const updateVideo = (index: number, field: "label" | "url", value: string) =>
    setVideos((current) => current.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)));
  const removeVideo = (index: number) => setVideos((current) => current.filter((_, i) => i !== index));

  const [nearbyPlaces, setNearbyPlaces] = useState<{ category: string; name: string; distanceKm: string }[]>(
    initialLand?.nearby.map((place) => ({ category: place.category, name: place.name, distanceKm: String(place.distanceKm) })) ?? []
  );
  const addNearbyPlace = () => setNearbyPlaces((current) => [...current, { category: "Landmark", name: "", distanceKm: "" }]);
  const updateNearbyPlace = (index: number, field: "category" | "name" | "distanceKm", value: string) =>
    setNearbyPlaces((current) => current.map((place, i) => (i === index ? { ...place, [field]: value } : place)));
  const removeNearbyPlace = (index: number) => setNearbyPlaces((current) => current.filter((_, i) => i !== index));

  const contactNameRef = useRef<HTMLInputElement>(null);
  const contactEmailRef = useRef<HTMLInputElement>(null);
  const contactPhoneRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [publishMessage, setPublishMessage] = useState("");

  const sellerOptions = sellerType === "developer" ? developers : sellerType === "construction_company" ? constructionCompanies : [];
  const selectedSeller = sellerOptions.find((option) => option.slug === sellerSlug);

  const buildPayload = (): Partial<Land> & { title: string } => {
    const sellerName = sellerType === "builder" ? (builderNameRef.current?.value || "Builder") : (selectedSeller?.name ?? "");

    return {
      title: titleRef.current?.value || initialLand?.title || "Untitled land listing",
      sellerType,
      sellerSlug: sellerType === "builder" ? undefined : (sellerSlug || undefined),
      sellerName,
      status,
      isFeatured,
      location: addressRef.current?.value || initialLand?.location || "",
      province,
      district,
      city,
      landSizePerches: Number(landSizePerchesRef.current?.value || 0),
      landSizeAcres: landSizeAcresRef.current?.value ? Number(landSizeAcresRef.current.value) : undefined,
      priceLkr: Number(priceLkrRef.current?.value || 0),
      pricePerPerchLkrMin: pricePerPerchMinRef.current?.value ? Number(pricePerPerchMinRef.current.value) : undefined,
      pricePerPerchLkrMax: pricePerPerchMaxRef.current?.value ? Number(pricePerPerchMaxRef.current.value) : undefined,
      landUse,
      landType: landTypeRef.current?.value || undefined,
      landShape: landShapeRef.current?.value || undefined,
      roadAccess: roadAccessRef.current?.value || undefined,
      roadWidthFt: roadWidthRef.current?.value ? Number(roadWidthRef.current.value) : undefined,
      electricity: electricity || undefined,
      water: water || undefined,
      titleType: titleTypeRef.current?.value || undefined,
      surveyPlanStatus: surveyPlanStatusRef.current?.value || undefined,
      paymentPlanItems: paymentPlanItems.map((item) => item.trim()).filter(Boolean),
      facilities,
      badges,
      unitFeatures: featureCategories
        .map((category) => ({ ...category, items: category.items.filter((item) => item.field.trim() || item.value.trim()) }))
        .filter((category) => category.items.length > 0),
      plots: plots
        .filter((plot) => plot.name.trim())
        .map((plot) => ({ id: plot.id, name: plot.name, sizePerches: Number(plot.sizePerches || 0), priceLkr: Number(plot.priceLkr || 0), status: plot.status, image: plot.image.trim() || undefined })),
      summary: descriptionRef.current?.value || initialLand?.summary || "",
      description: descriptionRef.current?.value || initialLand?.description || "",
      heroImage: heroImageRef.current?.value || initialLand?.heroImage || "",
      gallery: gallery.filter((entry) => entry.image.trim()),
      blockPlanImages: blockPlanImages.filter((entry) => entry.image.trim()),
      roadMapImages: roadMapImages.filter((entry) => entry.image.trim()),
      videos: videos.filter((entry) => entry.url.trim()),
      nearby: nearbyPlaces
        .filter((place) => place.name.trim())
        .map((place) => ({ category: place.category as NearbyPlace["category"], name: place.name, distanceKm: Number(place.distanceKm || 0) })),
      contact: {
        name: contactNameRef.current?.value || initialLand?.contact.name || "",
        email: contactEmailRef.current?.value || initialLand?.contact.email || "",
        phone: contactPhoneRef.current?.value || initialLand?.contact.phone || "",
      },
    };
  };

  const handleSaveOrPublish = async () => {
    setSaving(true);
    setSaveError("");
    setPublishMessage("");

    try {
      const payload = buildPayload();

      if (initialLand) {
        const response = await fetch(`/api/lands/${initialLand.slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          setSaveError(data?.error ?? "Unable to save changes.");
          return;
        }
        setPublishMessage("Land listing saved.");
      } else {
        const response = await fetch("/api/lands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.slug) {
          setSaveError(data?.error ?? "Unable to publish this land listing.");
          return;
        }
        window.location.href = `/admin/lands/${data.slug}/edit`;
        return;
      }
    } catch {
      setSaveError("Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="grid min-w-0 w-full gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border border-stone-200 bg-white p-3 lg:sticky lg:top-4 lg:h-fit">
        <ol className="grid gap-2 text-sm">
          {steps.map((label, idx) => (
            <li key={label}>
              <button type="button" onClick={() => setStep(idx)} className={`w-full border px-2 py-2 text-left ${step === idx ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200"}`}>
                {idx + 1}. {label}
              </button>
            </li>
          ))}
        </ol>
      </aside>

      <div className="box-border min-w-0 w-full space-y-4 border border-stone-200 bg-white p-4">
        <h2 className="text-xl font-semibold">{steps[step]}</h2>

        <div className={`grid gap-3 md:grid-cols-2 border border-slate-200 bg-slate-50 p-3 ${stepVisible(0)}`}>
          <Field label="Land title" className="md:col-span-2"><input ref={titleRef} defaultValue={initialLand?.title} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" required /></Field>

          <label className="grid gap-1 text-xs text-stone-700">
            <span>Seller type</span>
            <select value={sellerType} onChange={(event) => { setSellerType(event.target.value as LandSellerType); setSellerSlug(""); }} className="border border-stone-300 bg-white px-3 py-2 text-sm">
              <option value="developer">Developer</option>
              <option value="construction_company">Construction company</option>
              <option value="builder">Independent builder (no profile page)</option>
            </select>
          </label>

          {sellerType === "builder" ? (
            <Field label="Builder / seller name"><input ref={builderNameRef} defaultValue={initialLand?.sellerType === "builder" ? initialLand.sellerName : ""} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" /></Field>
          ) : (
            <label className="grid gap-1 text-xs text-stone-700">
              <span>{sellerType === "developer" ? "Developer" : "Construction company"}</span>
              <select value={sellerSlug} onChange={(event) => setSellerSlug(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                <option value="">Select</option>
                {sellerOptions.map((option) => (
                  <option key={option.slug} value={option.slug}>{option.name}</option>
                ))}
              </select>
            </label>
          )}

          <Field label="Address"><input ref={addressRef} defaultValue={initialLand?.location} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" /></Field>

          <label className="grid gap-1 text-xs text-stone-700">
            <span>Province</span>
            <select value={province} onChange={(event) => { setProvince(event.target.value); setDistrict(""); setCity(""); }} className="border border-stone-300 bg-white px-3 py-2 text-sm">
              <option value="">Select province</option>
              {sriLankaProvinces.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label className="grid gap-1 text-xs text-stone-700">
            <span>District</span>
            <select value={district} onChange={(event) => { setDistrict(event.target.value); setCity(""); }} disabled={!province} className="border border-stone-300 bg-white px-3 py-2 text-sm disabled:bg-stone-100 disabled:text-stone-500">
              <option value="">Select district</option>
              {districtOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label className="grid gap-1 text-xs text-stone-700">
            <span>City</span>
            <select value={city} onChange={(event) => setCity(event.target.value)} disabled={!district} className="border border-stone-300 bg-white px-3 py-2 text-sm disabled:bg-stone-100 disabled:text-stone-500">
              <option value="">Select city</option>
              {cityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label className="grid gap-1 text-xs text-stone-700">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as Land["status"])} className="border border-stone-300 bg-white px-3 py-2 text-sm">
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Sold">Sold</option>
            </select>
          </label>

          <label className="flex items-center gap-2 border border-stone-200 bg-white px-3 py-2 text-sm">
            <input type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} />
            Featured
          </label>
        </div>

        <div className={`grid gap-3 md:grid-cols-2 border border-emerald-200 bg-emerald-50 p-3 ${stepVisible(1)}`}>
          <Field label="Land size (perches)"><input ref={landSizePerchesRef} defaultValue={initialLand ? String(initialLand.landSizePerches) : undefined} type="number" min="0" step="0.1" className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" /></Field>
          <Field label="Land size (acres, optional)"><input ref={landSizeAcresRef} defaultValue={initialLand?.landSizeAcres ? String(initialLand.landSizeAcres) : undefined} type="number" min="0" step="0.01" className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" /></Field>
          <Field label="Price (LKR)"><input ref={priceLkrRef} defaultValue={initialLand ? String(initialLand.priceLkr) : undefined} type="number" min="0" step="1" className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" /></Field>
          <label className="grid gap-1 text-xs text-stone-700">
            <span>Price per perch (LKR, optional)</span>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <input ref={pricePerPerchMinRef} defaultValue={initialLand?.pricePerPerchLkrMin ? String(initialLand.pricePerPerchLkrMin) : undefined} type="number" min="0" step="1" className="border border-stone-300 px-3 py-2 text-sm" placeholder="From" />
              <span className="text-stone-500">to</span>
              <input ref={pricePerPerchMaxRef} defaultValue={initialLand?.pricePerPerchLkrMax ? String(initialLand.pricePerPerchLkrMax) : undefined} type="number" min="0" step="1" className="border border-stone-300 px-3 py-2 text-sm" placeholder="To" />
            </div>
          </label>

          <label className="grid gap-1 text-xs text-stone-700">
            <span>Land use</span>
            <select value={landUse} onChange={(event) => setLandUse(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Agricultural">Agricultural</option>
              <option value="Mixed">Mixed</option>
            </select>
          </label>

          <Field label="Land type"><input ref={landTypeRef} defaultValue={initialLand?.landType} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" placeholder="e.g. Bare Land, Land with House, Coconut Land" /></Field>
          <Field label="Shape of land"><input ref={landShapeRef} defaultValue={initialLand?.landShape} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" placeholder="e.g. Rectangular, Square, Irregular" /></Field>
          <Field label="Road access"><input ref={roadAccessRef} defaultValue={initialLand?.roadAccess} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" placeholder="e.g. Tarred road frontage" /></Field>
          <Field label="Road width (ft, optional)"><input ref={roadWidthRef} defaultValue={initialLand?.roadWidthFt ? String(initialLand.roadWidthFt) : undefined} type="number" min="0" step="1" className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" /></Field>
          <label className="grid gap-1 text-xs text-stone-700">
            <span>Electricity</span>
            <select value={electricity} onChange={(event) => setElectricity(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
              <option value="">Select</option>
              <option value="Available">Available</option>
              <option value="3-Phase Available">3-Phase Available</option>
              <option value="Not available">Not available</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs text-stone-700">
            <span>Water</span>
            <select value={water} onChange={(event) => setWater(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
              <option value="">Select</option>
              <option value="Pipe-borne water available">Pipe-borne water available</option>
              <option value="Well water available">Well water available</option>
              <option value="Not available">Not available</option>
            </select>
          </label>
          <Field label="Title / deed type"><input ref={titleTypeRef} defaultValue={initialLand?.titleType} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" placeholder="e.g. Freehold - Sinhala Deed" /></Field>
          <Field label="Survey plan"><input ref={surveyPlanStatusRef} defaultValue={initialLand?.surveyPlanStatus} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" placeholder="e.g. Approved survey plan" /></Field>
          <Field label="Description" className="md:col-span-2"><textarea ref={descriptionRef} defaultValue={initialLand?.description} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" rows={4} /></Field>
        </div>

        <div className={`border border-sky-200 bg-sky-50 p-3 ${stepVisible(2)}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-stone-900">Payment Plan</p>
            <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={addPaymentPlanItem}>Add payment line</Button>
          </div>
          <div className="mt-3 grid gap-2">
            {paymentPlanItems.map((item, index) => (
              <div key={`payment-plan-item-${index}`} className="grid gap-2 md:grid-cols-[1fr_auto]">
                <input value={item} onChange={(event) => updatePaymentPlanItem(index, event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm" placeholder={`Payment line ${index + 1}, e.g. "40% down payment with 24 months interest-free plan"`} />
                {paymentPlanItems.length > 1 ? <Button type="button" variant="outline" className="h-10 px-3 text-xs" onClick={() => removePaymentPlanItem(index)}>Remove</Button> : null}
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-sky-200 pt-3">
            <p className="text-xs font-semibold text-stone-800">Trust badges</p>
            <p className="mt-1 text-xs text-stone-600">Small marketing badges shown in the hero — distinct from the payment lines above.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {trustBadgeOptions.map((badge) => (
                <label key={badge} className="flex items-center gap-2 border border-stone-200 bg-white px-3 py-2 text-sm">
                  <input type="checkbox" checked={badges.includes(badge)} onChange={() => toggleBadge(badge)} />{badge}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={`border border-pink-200 bg-pink-50 p-3 ${stepVisible(3)}`}>
          <p className="text-sm font-medium text-stone-900">Facilities</p>
          <p className="mt-1 text-xs text-stone-600">General parcel characteristics — distinct from building amenities, which don&apos;t apply to raw land.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {facilityOptions.map((facility) => (
              <label key={facility} className="flex items-center gap-2 border border-stone-200 bg-white px-3 py-2 text-sm">
                <input type="checkbox" checked={facilities.includes(facility)} onChange={() => toggleFacility(facility)} />{facility}
              </label>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input value={customFacility} onChange={(event) => setCustomFacility(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustomFacility(); } }} className="min-w-0 flex-1 border border-stone-300 bg-white px-3 py-2 text-sm" placeholder="Custom facility" />
            <Button type="button" variant="outline" onClick={addCustomFacility}>Add facility</Button>
          </div>

          {facilities.filter((facility) => !facilityOptions.includes(facility)).length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {facilities.filter((facility) => !facilityOptions.includes(facility)).map((facility) => (
                <span key={facility} className="flex items-center gap-2 border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-700">
                  {facility}
                  <button type="button" aria-label={`Remove ${facility}`} onClick={() => removeFacility(facility)} className="text-stone-500">✕</button>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className={`border border-indigo-200 bg-indigo-50 p-3 ${stepVisible(4)}`}>
          <p className="text-sm font-medium text-stone-900">Key Features</p>
          <p className="mt-1 text-xs text-stone-600">In-unit finishes — for land sold with a planned/model home. Leave empty for a bare parcel.</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <div className="flex shrink-0 flex-col gap-2 sm:w-48">
              <div className="flex flex-row flex-wrap gap-2 sm:flex-col" role="tablist" aria-label="Key feature category">
                {featureCategories.map((category, categoryIndex) => {
                  const active = activeFeatureCategoryIndex === categoryIndex;
                  return (
                    <div key={category.key} className="flex items-center gap-1">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setActiveFeatureCategoryIndex(categoryIndex)}
                        className={`min-w-0 flex-1 border px-3 py-2 text-left text-sm font-medium ${active ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-stone-700"}`}
                      >
                        {category.label} ({category.items.filter((item) => item.field.trim() || item.value.trim()).length})
                      </button>
                      {category.key !== "indoor" && category.key !== "outdoor" ? (
                        <button type="button" aria-label={`Remove ${category.label} category`} onClick={() => removeFeatureCategory(categoryIndex)} className="border border-stone-300 bg-white px-2 py-2 text-xs text-stone-500">✕</button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input value={newFeatureCategoryName} onChange={(event) => setNewFeatureCategoryName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addFeatureCategory(); } }} placeholder="New category name" className="min-w-0 flex-1 border border-stone-300 bg-white px-2 py-1.5 text-xs" />
                <Button type="button" variant="outline" className="h-8 shrink-0 px-2 text-xs" onClick={addFeatureCategory}>Add</Button>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              {featureCategories[activeFeatureCategoryIndex]?.items.map((item, itemIndex) => {
                const category = featureCategories[activeFeatureCategoryIndex];
                const presets = featurePresetsForCategory(category.key);
                const presetFieldNames = Object.keys(presets);
                const isKnownField = presetFieldNames.includes(item.field);
                const valueOptions = isKnownField ? presets[item.field] : [];
                const isKnownValue = valueOptions.includes(item.value);

                return (
                  <div key={itemIndex} className="grid gap-2 border border-stone-200 bg-white p-2 md:grid-cols-[1fr_1fr_auto]">
                    <div className="grid gap-1">
                      {presetFieldNames.length > 0 ? (
                        <select
                          value={isKnownField ? item.field : "__custom__"}
                          onChange={(event) => {
                            const next = event.target.value;
                            updateFeatureItem(activeFeatureCategoryIndex, itemIndex, next === "__custom__" ? { field: "" } : { field: next, value: "" });
                          }}
                          className="border border-stone-300 bg-white px-2 py-2 text-sm"
                        >
                          <option value="__custom__">Custom field…</option>
                          {presetFieldNames.map((name) => <option key={name} value={name}>{name}</option>)}
                        </select>
                      ) : null}
                      {presetFieldNames.length === 0 || !isKnownField ? (
                        <input value={item.field} onChange={(event) => updateFeatureItem(activeFeatureCategoryIndex, itemIndex, { field: event.target.value })} placeholder="Field name" className="border border-stone-300 px-2 py-2 text-sm" />
                      ) : null}
                    </div>

                    <div className="grid gap-1">
                      {isKnownField && valueOptions.length > 0 ? (
                        <select
                          value={isKnownValue ? item.value : "__custom__"}
                          onChange={(event) => {
                            const next = event.target.value;
                            updateFeatureItem(activeFeatureCategoryIndex, itemIndex, { value: next === "__custom__" ? "" : next });
                          }}
                          className="border border-stone-300 bg-white px-2 py-2 text-sm"
                        >
                          <option value="__custom__">Custom value…</option>
                          {valueOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      ) : null}
                      {!(isKnownField && valueOptions.length > 0) || !isKnownValue ? (
                        <input value={item.value} onChange={(event) => updateFeatureItem(activeFeatureCategoryIndex, itemIndex, { value: event.target.value })} placeholder="Value" className="border border-stone-300 px-2 py-2 text-sm" />
                      ) : null}
                    </div>

                    <Button type="button" variant="outline" className="h-9 self-start px-3 text-xs" onClick={() => removeFeatureItem(activeFeatureCategoryIndex, itemIndex)}>Remove</Button>
                  </div>
                );
              })}
              {!featureCategories[activeFeatureCategoryIndex]?.items.length ? <p className="text-xs text-stone-500">No features added to this category yet.</p> : null}
              <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={() => addFeatureItem(activeFeatureCategoryIndex)}>Add feature</Button>
            </div>
          </div>
        </div>

        <div className={`border border-lime-200 bg-lime-50 p-3 ${stepVisible(5)}`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-stone-900">Plots</p>
              <p className="mt-1 text-xs text-stone-600">Individual plots/lots within this land development — the &quot;Floor Plans&quot; equivalent for a subdivided parcel. Leave empty for a single, unsubdivided parcel.</p>
            </div>
            <Button type="button" variant="outline" className="h-8 shrink-0 px-3 text-xs" onClick={addPlot}>Add plot</Button>
          </div>
          <div className="mt-3 grid gap-2">
            {plots.map((plot, index) => (
              <div key={plot.id} className="grid gap-2 border border-stone-200 bg-white p-2">
                <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                  <input value={plot.name} onChange={(event) => updatePlot(index, { name: event.target.value })} placeholder="Plot name, e.g. Lot A" className="border border-stone-300 px-2 py-2 text-sm" />
                  <input value={plot.sizePerches} onChange={(event) => updatePlot(index, { sizePerches: event.target.value })} type="number" min="0" step="0.1" placeholder="Size (perches)" className="border border-stone-300 px-2 py-2 text-sm" />
                  <input value={plot.priceLkr} onChange={(event) => updatePlot(index, { priceLkr: event.target.value })} type="number" min="0" step="1" placeholder="Price (LKR)" className="border border-stone-300 px-2 py-2 text-sm" />
                  <select value={plot.status} onChange={(event) => updatePlot(index, { status: event.target.value as LandPlot["status"] })} className="border border-stone-300 bg-white px-2 py-2 text-sm">
                    <option value="Available">Available</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Sold">Sold</option>
                  </select>
                  <Button type="button" variant="outline" className="h-9 px-3 text-xs" onClick={() => removePlot(index)}>Remove</Button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="grid gap-1 text-xs text-stone-700">
                    <span>Upload plot image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) updatePlot(index, { image: URL.createObjectURL(file) });
                      }}
                      className="border border-stone-300 bg-white px-2 py-2 text-sm file:mr-3 file:border-0 file:bg-stone-100 file:px-3 file:py-1 file:text-sm"
                    />
                  </label>
                  <input value={plot.image} onChange={(event) => updatePlot(index, { image: event.target.value })} placeholder="Or paste plot image URL" className="border border-stone-300 px-2 py-2 text-sm self-end" />
                </div>
                {plot.image ? <Image src={plot.image} alt={`${plot.name || "Plot"} preview`} width={320} height={180} unoptimized className="h-24 w-full object-cover bg-stone-50" /> : null}
              </div>
            ))}
            {plots.length === 0 ? <p className="text-xs text-stone-500">No plots added yet.</p> : null}
          </div>
        </div>

        <div className={`grid gap-3 border border-amber-200 bg-amber-50 p-3 ${stepVisible(6)}`}>
          <Field label="Hero image URL"><input ref={heroImageRef} defaultValue={initialLand?.heroImage} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" /></Field>

          <div className="border border-stone-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-stone-800">Gallery images</p>
              <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={addGalleryImage}>Add image</Button>
            </div>
            <div className="mt-3 grid gap-2">
              {gallery.map((entry, index) => (
                <div key={`gallery-${index}`} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
                  <input value={entry.label} onChange={(event) => updateGalleryImage(index, "label", event.target.value)} className="border border-stone-300 px-2 py-2 text-sm" placeholder="Label" />
                  <input value={entry.image} onChange={(event) => updateGalleryImage(index, "image", event.target.value)} className="border border-stone-300 px-2 py-2 text-sm" placeholder="Image URL" />
                  <Button type="button" variant="outline" className="h-9 px-3 text-xs" onClick={() => removeGalleryImage(index)}>Remove</Button>
                </div>
              ))}
              {gallery.length === 0 ? <p className="text-xs text-stone-500">No gallery images yet.</p> : null}
            </div>
          </div>

          <div className="border border-stone-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-stone-800">Block Plan images</p>
              <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={addBlockPlanImage}>Add block plan</Button>
            </div>
            <div className="mt-3 grid gap-2">
              {blockPlanImages.map((entry, index) => (
                <div key={`block-plan-${index}`} className="grid gap-2 border border-stone-200 p-2">
                  <input value={entry.label} onChange={(event) => updateBlockPlanImage(index, "label", event.target.value)} className="border border-stone-300 px-2 py-2 text-sm" placeholder={`Block plan ${index + 1} name`} />
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="grid gap-1 text-xs text-stone-700">
                      <span>Upload block plan image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) updateBlockPlanImage(index, "image", URL.createObjectURL(file));
                        }}
                        className="border border-stone-300 bg-white px-2 py-2 text-sm file:mr-3 file:border-0 file:bg-stone-100 file:px-3 file:py-1 file:text-sm"
                      />
                    </label>
                    <input value={entry.image} onChange={(event) => updateBlockPlanImage(index, "image", event.target.value)} placeholder="Or paste image URL" className="border border-stone-300 px-2 py-2 text-sm self-end" />
                  </div>
                  {entry.image ? <Image src={entry.image} alt={`${entry.label || `Block plan ${index + 1}`} preview`} width={320} height={180} unoptimized className="h-24 w-full object-cover bg-stone-50" /> : null}
                  <Button type="button" variant="outline" className="h-9 self-start px-3 text-xs" onClick={() => removeBlockPlanImage(index)}>Remove</Button>
                </div>
              ))}
              {blockPlanImages.length === 0 ? <p className="text-xs text-stone-500">No block plan images yet.</p> : null}
            </div>
          </div>

          <div className="border border-stone-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-stone-800">Road Map images</p>
              <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={addRoadMapImage}>Add road map</Button>
            </div>
            <div className="mt-3 grid gap-2">
              {roadMapImages.map((entry, index) => (
                <div key={`road-map-${index}`} className="grid gap-2 border border-stone-200 p-2">
                  <input value={entry.label} onChange={(event) => updateRoadMapImage(index, "label", event.target.value)} className="border border-stone-300 px-2 py-2 text-sm" placeholder={`Road map ${index + 1} name`} />
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="grid gap-1 text-xs text-stone-700">
                      <span>Upload road map image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) updateRoadMapImage(index, "image", URL.createObjectURL(file));
                        }}
                        className="border border-stone-300 bg-white px-2 py-2 text-sm file:mr-3 file:border-0 file:bg-stone-100 file:px-3 file:py-1 file:text-sm"
                      />
                    </label>
                    <input value={entry.image} onChange={(event) => updateRoadMapImage(index, "image", event.target.value)} placeholder="Or paste image URL" className="border border-stone-300 px-2 py-2 text-sm self-end" />
                  </div>
                  {entry.image ? <Image src={entry.image} alt={`${entry.label || `Road map ${index + 1}`} preview`} width={320} height={180} unoptimized className="h-24 w-full object-cover bg-stone-50" /> : null}
                  <Button type="button" variant="outline" className="h-9 self-start px-3 text-xs" onClick={() => removeRoadMapImage(index)}>Remove</Button>
                </div>
              ))}
              {roadMapImages.length === 0 ? <p className="text-xs text-stone-500">No road map images yet.</p> : null}
            </div>
          </div>

          <div className="border border-stone-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-stone-800">Videos</p>
              <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={addVideo}>Add video</Button>
            </div>
            <div className="mt-3 grid gap-2">
              {videos.map((entry, index) => (
                <div key={`video-${index}`} className="grid gap-2 border border-stone-200 p-2">
                  <input value={entry.label} onChange={(event) => updateVideo(index, "label", event.target.value)} className="border border-stone-300 px-2 py-2 text-sm" placeholder={`Video ${index + 1} name`} />
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="grid gap-1 text-xs text-stone-700">
                      <span>Upload video file</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) updateVideo(index, "url", URL.createObjectURL(file));
                        }}
                        className="border border-stone-300 bg-white px-2 py-2 text-sm file:mr-3 file:border-0 file:bg-stone-100 file:px-3 file:py-1 file:text-sm"
                      />
                    </label>
                    <input value={entry.url} onChange={(event) => updateVideo(index, "url", event.target.value)} placeholder="Or paste video URL (YouTube, TikTok, etc.)" className="border border-stone-300 px-2 py-2 text-sm self-end" />
                  </div>
                  {entry.url && (entry.url.startsWith("blob:") || /\.(mp4|webm|mov)(\?|$)/i.test(entry.url)) ? (
                    <video src={entry.url} controls className="h-32 w-full bg-stone-900" />
                  ) : null}
                  <Button type="button" variant="outline" className="h-9 self-start px-3 text-xs" onClick={() => removeVideo(index)}>Remove</Button>
                </div>
              ))}
              {videos.length === 0 ? <p className="text-xs text-stone-500">No videos yet.</p> : null}
            </div>
          </div>
        </div>

        <div className={`border border-cyan-200 bg-cyan-50 p-3 ${stepVisible(7)}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-stone-800">Nearby places</p>
            <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={addNearbyPlace}>Add place</Button>
          </div>
          <div className="mt-3 grid gap-2">
            {nearbyPlaces.map((place, index) => (
              <div key={`nearby-${index}`} className="grid gap-2 md:grid-cols-[140px_1fr_110px_auto]">
                <select value={place.category} onChange={(event) => updateNearbyPlace(index, "category", event.target.value)} className="border border-stone-300 bg-white px-2 py-2 text-sm">
                  {nearbyCategoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <input value={place.name} onChange={(event) => updateNearbyPlace(index, "name", event.target.value)} className="border border-stone-300 px-2 py-2 text-sm" placeholder="Place name" />
                <input value={place.distanceKm} onChange={(event) => updateNearbyPlace(index, "distanceKm", event.target.value)} type="number" min="0" step="0.1" className="border border-stone-300 px-2 py-2 text-sm" placeholder="Distance (km)" />
                <Button type="button" variant="outline" className="h-9 px-3 text-xs" onClick={() => removeNearbyPlace(index)}>Remove</Button>
              </div>
            ))}
            {nearbyPlaces.length === 0 ? <p className="text-xs text-stone-500">No nearby places added yet.</p> : null}
          </div>
        </div>

        <div className={`grid gap-3 md:grid-cols-2 border border-purple-200 bg-purple-50 p-3 ${stepVisible(8)}`}>
          <Field label="Contact name"><input ref={contactNameRef} defaultValue={initialLand?.contact.name} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" /></Field>
          <Field label="Email address"><input ref={contactEmailRef} defaultValue={initialLand?.contact.email} type="email" className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" /></Field>
          <Field label="Phone number" className="md:col-span-2"><input ref={contactPhoneRef} defaultValue={initialLand?.contact.phone} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" /></Field>
        </div>

        <div className={`grid gap-3 border border-teal-200 bg-teal-50 p-3 ${stepVisible(9)}`}>
          <Field label="SEO title"><input className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" /></Field>
          <Field label="SEO description"><textarea className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" rows={3} /></Field>
        </div>

        <div className={`border border-orange-200 bg-orange-50 p-3 ${stepVisible(10)}`}>
          <p className="text-sm font-medium text-stone-900">Publish</p>
          <p className="mt-1 text-xs text-stone-600">Review the steps above, then use Save/Publish below — available from any step.</p>
        </div>

        <div className="flex items-center gap-3 border-t border-stone-200 pt-4">
          <Button type="button" disabled={saving} onClick={handleSaveOrPublish}>{saving ? "Saving..." : initialLand ? "Save changes" : "Publish land listing"}</Button>
          {saveError ? <p className="text-xs text-red-600">{saveError}</p> : null}
          {publishMessage ? <p className="text-xs text-stone-700">{publishMessage}</p> : null}
        </div>
      </div>
    </section>
  );
}
