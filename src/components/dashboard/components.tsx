"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { developers } from "@/data/developers";
import {
  sriLankaCitiesByDistrict,
  sriLankaDistrictsByProvince,
  sriLankaNeighborhoodsByCity,
  sriLankaProvinces,
} from "@/data/sri-lanka-market-geo";

type FloorPlanDraft = {
  name: string;
  availability: string;
  status: string;
  beds: string;
  baths: string;
  sqft: string;
  interiorSize: string;
  balconySize: string;
  startingPrice: string;
  averagePricePerSqft: string;
  image: string;
};

type VirtualTourDraft = {
  label: string;
  url: string;
};

type MapImageDraft = {
  label: string;
  image: string;
};

export function DashboardSidebar({ links }: { links: { label: string; href: string }[] }) {
  return (
    <aside className="box-border min-w-0 w-full border-r border-stone-200 bg-white p-4">
      <nav className="grid gap-2 text-sm">
        {links.map((l) => <Link key={`${l.href}-${l.label}`} href={l.href} className="min-w-0 wrap-break-word border border-stone-200 px-3 py-2">{l.label}</Link>)}
      </nav>
    </aside>
  );
}

export function DashboardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="space-y-1"><h1 className="text-2xl font-semibold">{title}</h1><p className="text-sm text-stone-600">{subtitle}</p></div>;
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return <article className="border border-stone-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-stone-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></article>;
}

export function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto border border-stone-200 bg-white">
      <table className="w-full min-w-190 text-sm">
        <thead className="bg-stone-50"><tr>{columns.map((c) => <th key={c} className="p-3 text-left">{c}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i} className="border-t border-stone-100">{row.map((cell, j) => <td key={j} className="p-3">{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function Modal({ title, open, children }: { title: string; open: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/30"><div className="w-full max-w-lg border border-stone-200 bg-white p-4"><h3 className="mb-3 text-lg font-semibold">{title}</h3>{children}</div></div>;
}

export function Drawer({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="border border-stone-200 bg-white p-4"><h3 className="mb-3 text-lg font-semibold">{title}</h3>{children}</div>;
}

export function ConfirmationDialog({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(true)}>{label}</Button>
      <Modal title="Please confirm" open={open}><p className="text-sm text-stone-700">This is a mock confirmation dialog.</p><div className="mt-3 flex gap-2"><Button onClick={() => setOpen(false)}>Confirm</Button><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button></div></Modal>
    </div>
  );
}

export function ImageUploader() {
  const [images, setImages] = useState<string[]>(["Primary Image", "Lobby", "Rooftop"]);
  return (
    <div className="space-y-3 border border-stone-200 bg-white p-4">
      <p className="text-sm font-medium">Gallery Management</p>
      <button className="border border-stone-300 px-3 py-2 text-sm">Upload image</button>
      <ul className="grid gap-2">
        {images.map((img, index) => (
          <li key={img} className="flex items-center justify-between border border-stone-200 px-3 py-2 text-sm">
            <span>{img}</span>
            <div className="flex gap-2">
              <button onClick={() => setImages((list) => list.filter((_, i) => i !== index))}>Delete</button>
              <button onClick={() => setImages((list) => list.map((v, i) => (i === index ? `${v} (Primary)` : v)))}>Set primary</button>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-stone-500">Drag and drop reorder behavior is mocked via list order controls.</p>
    </div>
  );
}

export function BuilderProfileForm() {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [establishedYear, setEstablishedYear] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [activeProjects, setActiveProjects] = useState("");
  const [completedProjects, setCompletedProjects] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/developers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          logo,
          description,
          location,
          establishedYear: Number(establishedYear),
          yearsInBusiness: Number(yearsInBusiness),
          activeProjects: Number(activeProjects),
          completedProjects: Number(completedProjects),
          website,
          email,
          phone,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.slug) {
        setErrorMessage(data?.error ?? "Unable to create builder profile page.");
        setSaving(false);
        return;
      }

      window.location.href = `/developers/${data.slug}`;
    } catch {
      setErrorMessage("Unable to create builder profile page.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 border border-stone-200 bg-white p-4">
      <div>
        <h2 className="text-xl font-semibold">Create Builder Profile Page</h2>
        <p className="mt-1 text-sm text-stone-600">Fill this once. After save, your public builder page is automatically generated.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input value={name} onChange={(event) => setName(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Builder name" required />
        <input value={location} onChange={(event) => setLocation(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Primary location (e.g. Colombo 03)" required />

        <input value={logo} onChange={(event) => setLogo(event.target.value)} className="md:col-span-2 border border-stone-300 px-3 py-2 text-sm" placeholder="Logo image URL" required />
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="md:col-span-2 border border-stone-300 px-3 py-2 text-sm" rows={4} placeholder="Builder description" required />

        <input value={website} onChange={(event) => setWebsite(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Website URL" required />
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="border border-stone-300 px-3 py-2 text-sm" placeholder="Email" required />

        <input value={phone} onChange={(event) => setPhone(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Phone" required />
        <input value={establishedYear} onChange={(event) => setEstablishedYear(event.target.value)} type="number" min="1900" step="1" className="border border-stone-300 px-3 py-2 text-sm" placeholder="Established year" required />

        <input value={yearsInBusiness} onChange={(event) => setYearsInBusiness(event.target.value)} type="number" min="0" step="1" className="border border-stone-300 px-3 py-2 text-sm" placeholder="Years in business" required />
        <input value={activeProjects} onChange={(event) => setActiveProjects(event.target.value)} type="number" min="0" step="1" className="border border-stone-300 px-3 py-2 text-sm" placeholder="Active projects" required />

        <input value={completedProjects} onChange={(event) => setCompletedProjects(event.target.value)} type="number" min="0" step="1" className="border border-stone-300 px-3 py-2 text-sm" placeholder="Completed projects" required />
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-stone-500">Template is applied automatically. You can refine visuals later.</p>
        <Button type="submit" disabled={saving}>{saving ? "Creating page..." : "Create Builder Page"}</Button>
      </div>
    </form>
  );
}

export function ProjectWizard() {
  const projectTypeOptions = [
    "Luxury Condominium",
    "Apartment Development",
    "Mixed-use Development",
    "Townhouse Community",
    "Villa Community",
    "Affordable Housing",
  ];
  const projectStatusOptions = [
    "Now Selling",
    "Coming Soon",
    "Under Construction",
    "Launching Soon",
    "Nearly Sold Out",
    "Nearly Complete",
  ];
  const moveInYearOptions = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];
  const bedroomOptions = [1, 2, 3, 4, 5];
  const bathroomOptions = [1, 2, 3, 4, 5];
  const architectPageOptions = [
    { slug: "", label: "No page selected" },
    { slug: "kirkor-architect-and-planners", label: "Kirkor Architect and Planners" },
    { slug: "cityform-architects", label: "Cityform Architects" },
    { slug: "studio-grid-architecture", label: "Studio Grid Architecture" },
  ];
  const salesCompanyPageOptions = [
    { slug: "", label: "No page selected" },
    { slug: "ora-creative-agency", label: "ORA Creative Agency" },
    { slug: "prime-sales-lanka", label: "Prime Sales Lanka" },
    { slug: "urban-home-marketing", label: "Urban Home Marketing" },
  ];
  const interiorDesignerPageOptions = [
    { slug: "", label: "No page selected" },
    { slug: "pulsinelli", label: "Pulsinelli" },
    { slug: "atelier-habitat", label: "Atelier Habitat" },
    { slug: "spacecraft-interiors", label: "Spacecraft Interiors" },
  ];
  const neighborhoodPageOptions = [
    { slug: "", label: "No page selected" },
    { slug: "kollupitiya", label: "Kollupitiya" },
    { slug: "asgiriya", label: "Asgiriya" },
    { slug: "rajagiriya", label: "Rajagiriya" },
    { slug: "dehiwala", label: "Dehiwala" },
  ];
  const steps = [
    "Project Information",
    "Location",
    "Pricing",
    "Apartment Details",
    "Amenities",
    "Gallery",
    "Floor Plans",
    "Units",
    "Contact",
    "SEO",
    "Preview",
    "Publish",
  ];
  const statOptions = [
    "Listing status",
    "Building status",
    "Price range",
    "Address",
    "Total Units",
    "Floor plans",
    "Floors",
    "Property type",
    "Beds",
    "Baths",
    "SqFt",
    "Road",
    "Area",
    "Electricity",
    "Tap water",
    "Per SqFt (Avg)",
    "Incentives",
    "Parking",
    "Completion year",
  ];
  const maxVisibleStats = 10;
  const [step, setStep] = useState(0);
  const [publishMessage, setPublishMessage] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [projectType, setProjectType] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [moveInYear, setMoveInYear] = useState("");
  const [constructionStarted, setConstructionStarted] = useState("");
  const [estimatedCompletion, setEstimatedCompletion] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");

  const [startingPriceMin, setStartingPriceMin] = useState("");
  const [startingPriceMax, setStartingPriceMax] = useState("");
  const [priceRangeMin, setPriceRangeMin] = useState("");
  const [priceRangeMax, setPriceRangeMax] = useState("");
  const [availableUnitPriceMin, setAvailableUnitPriceMin] = useState("");
  const [availableUnitPriceMax, setAvailableUnitPriceMax] = useState("");
  const [pricePerSqft, setPricePerSqft] = useState("");
  const [availablePlanPricesMin, setAvailablePlanPricesMin] = useState("");
  const [availablePlanPricesMax, setAvailablePlanPricesMax] = useState("");
  const [pricingComingSoon, setPricingComingSoon] = useState("");
  const [averagePricePerSqft, setAveragePricePerSqft] = useState("");
  const [monthlyMaintenancePerSqft, setMonthlyMaintenancePerSqft] = useState("");
  const [propertyTax, setPropertyTax] = useState("");
  const [parkingCost, setParkingCost] = useState("");
  const [storageCost, setStorageCost] = useState("");
  const [coopFeeRealtors, setCoopFeeRealtors] = useState("");
  const [pricingHistoryDate, setPricingHistoryDate] = useState("");
  const [pricingHistoryNote, setPricingHistoryNote] = useState("");
  const [paymentStructure, setPaymentStructure] = useState("");
  const [incentives, setIncentives] = useState<string[]>([]);

  const [bedMin, setBedMin] = useState("");
  const [bedMax, setBedMax] = useState("");
  const [bathMin, setBathMin] = useState("");
  const [bathMax, setBathMax] = useState("");
  const [sqftMin, setSqftMin] = useState("");
  const [sqftMax, setSqftMax] = useState("");
  const [floorPlans, setFloorPlans] = useState<FloorPlanDraft[]>([
    { name: "", availability: "", status: "", beds: "", baths: "", sqft: "", interiorSize: "", balconySize: "", startingPrice: "", averagePricePerSqft: "", image: "" },
    { name: "", availability: "", status: "", beds: "", baths: "", sqft: "", interiorSize: "", balconySize: "", startingPrice: "", averagePricePerSqft: "", image: "" },
  ]);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState("");
  const [blockPlanImages, setBlockPlanImages] = useState<MapImageDraft[]>([{ label: "", image: "" }]);
  const [roadMapImages, setRoadMapImages] = useState<MapImageDraft[]>([{ label: "", image: "" }]);
  const [interactiveMapUrl, setInteractiveMapUrl] = useState("");
  const [virtualTours, setVirtualTours] = useState<VirtualTourDraft[]>([]);

  const [visibleStats, setVisibleStats] = useState<string[]>([
    "Price range",
    "Property type",
    "Beds",
    "Baths",
    "SqFt",
    "Listing status",
  ]);

  const districtOptions = province ? (sriLankaDistrictsByProvince[province] ?? []) : [];
  const cityOptions = district ? (sriLankaCitiesByDistrict[district] ?? []) : [];
  const neighborhoodOptions = city ? (sriLankaNeighborhoodsByCity[city] ?? [city]) : [];

  const toggleStat = (stat: string) => {
    setVisibleStats((current) => {
      if (current.includes(stat)) {
        return current.filter((value) => value !== stat);
      }

      if (current.length >= maxVisibleStats) {
        return current;
      }

      return [...current, stat];
    });
  };

  const getRangeError = (min: string, max: string, label: string) => {
    if (!min || !max) {
      return null;
    }

    if (Number(max) < Number(min)) {
      return `${label}: max must be greater than or equal to min.`;
    }

    return null;
  };

  const startingPriceError = getRangeError(startingPriceMin, startingPriceMax, "Starting price");
  const priceRangeError = getRangeError(priceRangeMin, priceRangeMax, "Price range");
  const availableUnitPriceError = getRangeError(availableUnitPriceMin, availableUnitPriceMax, "Available unit price");
  const sqftRangeError = getRangeError(sqftMin, sqftMax, "SqFt range");

  const formHasErrors = Boolean(startingPriceError || priceRangeError || availableUnitPriceError || sqftRangeError);

  const bedMaxOptions = bedroomOptions.filter((value) => !bedMin || value >= Number(bedMin));
  const bathMaxOptions = bathroomOptions.filter((value) => !bathMin || value >= Number(bathMin));

  const normalizedBedRange = bedMin && bedMax ? `${bedMin}-${bedMax}` : "Not set";
  const normalizedBathRange = bathMin && bathMax ? `${bathMin}-${bathMax}` : "Not set";
  const normalizedSqftRange = sqftMin && sqftMax ? `${sqftMin}-${sqftMax}` : "Not set";
  const normalizedPriceRange = priceRangeMin && priceRangeMax ? `${priceRangeMin}-${priceRangeMax}` : "Not set";
  const normalizedAvailableRange = availableUnitPriceMin && availableUnitPriceMax ? `${availableUnitPriceMin}-${availableUnitPriceMax}` : "Not set";
  const normalizedAvailablePlanPrices = availablePlanPricesMin && availablePlanPricesMax
    ? `${availablePlanPricesMin}-${availablePlanPricesMax}`
    : "Not set";

  const addIncentive = () => {
    setIncentives((current) => [...current, ""]);
  };

  const updateIncentive = (index: number, value: string) => {
    setIncentives((current) => current.map((entry, idx) => (idx === index ? value : entry)));
  };

  const removeIncentive = (index: number) => {
    setIncentives((current) => {
      if (current.length === 0) {
        return current;
      }
      return current.filter((_, idx) => idx !== index);
    });
  };

  const updateFloorPlan = (index: number, field: keyof FloorPlanDraft, value: string) => {
    setFloorPlans((current) => current.map((plan, planIndex) => (
      planIndex === index ? { ...plan, [field]: value } : plan
    )));
  };

  const addFloorPlan = () => {
    setFloorPlans((current) => [...current, { name: "", availability: "", status: "", beds: "", baths: "", sqft: "", interiorSize: "", balconySize: "", startingPrice: "", averagePricePerSqft: "", image: "" }]);
  };

  const addVirtualTour = () => {
    setVirtualTours((current) => [...current, { label: "", url: "" }]);
  };

  const updateVirtualTour = (index: number, field: keyof VirtualTourDraft, value: string) => {
    setVirtualTours((current) => current.map((tour, tourIndex) => (
      tourIndex === index ? { ...tour, [field]: value } : tour
    )));
  };

  const removeVirtualTour = (index: number) => {
    setVirtualTours((current) => current.filter((_, tourIndex) => tourIndex !== index));
  };

  const updateUploadedImage = (file: File | undefined, setter: (value: string) => void) => {
    if (file) {
      setter(URL.createObjectURL(file));
    }
  };

  const updateMapImage = (type: "block" | "road", index: number, field: keyof MapImageDraft, value: string) => {
    const setter = type === "block" ? setBlockPlanImages : setRoadMapImages;
    setter((current) => current.map((entry, entryIndex) => (
      entryIndex === index ? { ...entry, [field]: value } : entry
    )));
  };

  const addMapImage = (type: "block" | "road") => {
    const setter = type === "block" ? setBlockPlanImages : setRoadMapImages;
    setter((current) => [...current, { label: "", image: "" }]);
  };

  const removeMapImage = (type: "block" | "road", index: number) => {
    const setter = type === "block" ? setBlockPlanImages : setRoadMapImages;
    setter((current) => current.length === 1 ? current : current.filter((_, entryIndex) => entryIndex !== index));
  };

  const selectStep = (index: number) => {
    setStep(index);
    window.requestAnimationFrame(() => {
      sectionRefs.current[index]?.scrollIntoView({ block: "start" });
    });
  };

  return (
    <section className="grid min-w-0 w-full gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border border-stone-200 bg-white p-3">
        <ol className="grid gap-2 text-sm">
          {steps.map((s, idx) => (
            <li key={s}>
              <button type="button" onClick={() => selectStep(idx)} className={`w-full border px-2 py-2 text-left ${step === idx ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200"}`}>
                {idx + 1}. {s}
              </button>
            </li>
          ))}
        </ol>
      </aside>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="box-border min-w-0 w-full space-y-4 border border-stone-200 bg-white p-4">
          <h2 className="text-xl font-semibold">{steps[step]}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div ref={(element) => { sectionRefs.current[0] = element; }} className="md:col-span-2 border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-stone-900">Project Information</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <input className="border border-stone-300 bg-white px-3 py-2 text-sm" placeholder="Project Name" />

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Project Type</span>
                  <select value={projectType} onChange={(event) => setProjectType(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                    <option value="">Select project type</option>
                    {projectTypeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <textarea className="md:col-span-2 border border-stone-300 bg-white px-3 py-2 text-sm" rows={4} placeholder="Description" />

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Listing Status</span>
                  <select value={projectStatus} onChange={(event) => setProjectStatus(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                    <option value="">Select listing status</option>
                    {projectStatusOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Move-in Year</span>
                  <select value={moveInYear} onChange={(event) => setMoveInYear(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                    <option value="">Select move-in year</option>
                    {moveInYearOptions.map((option) => (
                      <option key={option} value={String(option)}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Construction Started</span>
                  <input type="month" value={constructionStarted} onChange={(event) => setConstructionStarted(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm" />
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Estimated Completion</span>
                  <select value={estimatedCompletion} onChange={(event) => setEstimatedCompletion(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                    <option value="">Select estimated completion</option>
                    {moveInYearOptions.map((option) => <option key={`completion-${option}`} value={String(option)}>{option}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div ref={(element) => { sectionRefs.current[1] = element; }} className="md:col-span-2 border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-medium text-stone-900">Location</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <input className="border border-stone-300 bg-white px-3 py-2 text-sm" placeholder="Address" />

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Province</span>
                  <select
                    value={province}
                    onChange={(event) => {
                      setProvince(event.target.value);
                      setDistrict("");
                      setCity("");
                      setNeighborhood("");
                    }}
                    className="border border-stone-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Select province</option>
                    {sriLankaProvinces.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>District</span>
                  <select
                    value={district}
                    onChange={(event) => {
                      setDistrict(event.target.value);
                      setCity("");
                      setNeighborhood("");
                    }}
                    disabled={!province}
                    className="border border-stone-300 bg-white px-3 py-2 text-sm disabled:bg-stone-100 disabled:text-stone-500"
                  >
                    <option value="">Select district</option>
                    {districtOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>City</span>
                  <select
                    value={city}
                    onChange={(event) => {
                      setCity(event.target.value);
                      setNeighborhood("");
                    }}
                    disabled={!district}
                    className="border border-stone-300 bg-white px-3 py-2 text-sm disabled:bg-stone-100 disabled:text-stone-500"
                  >
                    <option value="">Select city</option>
                    {cityOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Neighborhood</span>
                  <select
                    value={neighborhood}
                    onChange={(event) => setNeighborhood(event.target.value)}
                    disabled={!city}
                    className="border border-stone-300 bg-white px-3 py-2 text-sm disabled:bg-stone-100 disabled:text-stone-500"
                  >
                    <option value="">Select neighborhood</option>
                    {neighborhoodOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div ref={(element) => { sectionRefs.current[2] = element; }} className="md:col-span-2 border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-stone-900">Pricing</p>
              <p className="mt-1 text-xs text-stone-600">Use min and max values only. This keeps all listings consistently formatted.</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Starting Price (LKR)</span>
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                    <input type="number" min="0" step="1" value={startingPriceMin} onChange={(event) => setStartingPriceMin(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Min" />
                    <span className="text-stone-500">to</span>
                    <input type="number" min="0" step="1" value={startingPriceMax} onChange={(event) => setStartingPriceMax(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Max" />
                  </div>
                  {startingPriceError ? <span className="text-xs text-red-600">{startingPriceError}</span> : null}
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Price Range (LKR)</span>
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                    <input type="number" min="0" step="1" value={priceRangeMin} onChange={(event) => setPriceRangeMin(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Min" />
                    <span className="text-stone-500">to</span>
                    <input type="number" min="0" step="1" value={priceRangeMax} onChange={(event) => setPriceRangeMax(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Max" />
                  </div>
                  {priceRangeError ? <span className="text-xs text-red-600">{priceRangeError}</span> : null}
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Available Unit Price (LKR)</span>
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                    <input type="number" min="0" step="1" value={availableUnitPriceMin} onChange={(event) => setAvailableUnitPriceMin(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Min" />
                    <span className="text-stone-500">to</span>
                    <input type="number" min="0" step="1" value={availableUnitPriceMax} onChange={(event) => setAvailableUnitPriceMax(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Max" />
                  </div>
                  {availableUnitPriceError ? <span className="text-xs text-red-600">{availableUnitPriceError}</span> : null}
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Price per SqFt (LKR)</span>
                  <input type="number" min="0" step="1" value={pricePerSqft} onChange={(event) => setPricePerSqft(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Single value" />
                </label>
              </div>
            </div>

            <div ref={(element) => { sectionRefs.current[3] = element; }} className="md:col-span-2 border border-sky-200 bg-sky-50 p-3">
              <p className="text-sm font-medium text-stone-900">Pricing and Fees</p>
              <p className="mt-1 text-xs text-stone-600">Manage available plan pricing, fees, payment structure, and incentives shown in the public pricing section.</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Available plan prices</span>
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                    <label className="grid min-w-0 gap-1 text-xs text-stone-600">
                      <span>From</span>
                      <input type="number" min="0" step="1" value={availablePlanPricesMin} onChange={(event) => setAvailablePlanPricesMin(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                    </label>
                    <span className="text-stone-500">to</span>
                    <label className="grid min-w-0 gap-1 text-xs text-stone-600">
                      <span>To</span>
                      <input type="number" min="0" step="1" value={availablePlanPricesMax} onChange={(event) => setAvailablePlanPricesMax(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                    </label>
                  </div>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Pricing</span>
                  <input value={pricingComingSoon} onChange={(event) => setPricingComingSoon(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Average price per sqft</span>
                  <input value={averagePricePerSqft} onChange={(event) => setAveragePricePerSqft(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Monthly C.C./maint per sqft</span>
                  <input value={monthlyMaintenancePerSqft} onChange={(event) => setMonthlyMaintenancePerSqft(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Property tax</span>
                  <input value={propertyTax} onChange={(event) => setPropertyTax(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Parking cost</span>
                  <input value={parkingCost} onChange={(event) => setParkingCost(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Storage cost</span>
                  <input value={storageCost} onChange={(event) => setStorageCost(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Co-op fee realtors</span>
                  <input value={coopFeeRealtors} onChange={(event) => setCoopFeeRealtors(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                </label>

                <div className="grid gap-3 border border-stone-200 bg-white p-3 md:col-span-2">
                  <p className="text-sm font-medium text-stone-900">Payment Structure</p>
                  <label className="grid gap-1 text-xs text-stone-700">
                    <span>Payment structure</span>
                    <textarea value={paymentStructure} onChange={(event) => setPaymentStructure(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" rows={3} />
                  </label>
                  <div className="grid gap-3">
                    <label className="grid gap-1 text-xs text-stone-700">
                      <span>Pricing history date</span>
                      <input type="date" value={pricingHistoryDate} onChange={(event) => setPricingHistoryDate(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                    </label>
                    <label className="grid gap-1 text-xs text-stone-700">
                      <span>Pricing History Information</span>
                      <textarea value={pricingHistoryNote} onChange={(event) => setPricingHistoryNote(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" rows={3} />
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2 border border-stone-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-stone-800">Current incentives</p>
                    <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={addIncentive}>Add incentive</Button>
                  </div>
                  <p className="mt-1 text-xs text-stone-600">Add incentives as needed.</p>
                  <div className="mt-3 grid gap-2">
                    {incentives.map((incentive, index) => (
                      <div key={`incentive-${index}`} className="grid gap-2 md:grid-cols-[1fr_auto]">
                        <input
                          value={incentive}
                          onChange={(event) => updateIncentive(index, event.target.value)}
                          className="border border-stone-300 px-3 py-2 text-sm"
                          placeholder={`Incentive ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 px-3 text-xs"
                          onClick={() => removeIncentive(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div ref={(element) => { sectionRefs.current[6] = element; }} className="md:col-span-2 border border-cyan-200 bg-cyan-50 p-3">
              <p className="text-sm font-medium text-stone-900">Apartment Details</p>
              <p className="mt-1 text-xs text-stone-600">Select ranges from dropdowns so values remain clean and consistent on listing cards.</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Bed Range</span>
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                    <select
                      value={bedMin}
                      onChange={(event) => {
                        const nextMin = event.target.value;
                        setBedMin(nextMin);
                        if (bedMax && nextMin && Number(bedMax) < Number(nextMin)) {
                          setBedMax("");
                        }
                      }}
                      className="border border-stone-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">From</option>
                      {bedroomOptions.map((option) => (
                        <option key={`bed-min-${option}`} value={String(option)}>{option}</option>
                      ))}
                    </select>
                    <span className="text-stone-500">to</span>
                    <select value={bedMax} onChange={(event) => setBedMax(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                      <option value="">To</option>
                      {bedMaxOptions.map((option) => (
                        <option key={`bed-max-${option}`} value={String(option)}>{option}</option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Bath Range</span>
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                    <select
                      value={bathMin}
                      onChange={(event) => {
                        const nextMin = event.target.value;
                        setBathMin(nextMin);
                        if (bathMax && nextMin && Number(bathMax) < Number(nextMin)) {
                          setBathMax("");
                        }
                      }}
                      className="border border-stone-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">From</option>
                      {bathroomOptions.map((option) => (
                        <option key={`bath-min-${option}`} value={String(option)}>{option}</option>
                      ))}
                    </select>
                    <span className="text-stone-500">to</span>
                    <select value={bathMax} onChange={(event) => setBathMax(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                      <option value="">To</option>
                      {bathMaxOptions.map((option) => (
                        <option key={`bath-max-${option}`} value={String(option)}>{option}</option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span className="font-medium text-stone-900">SqFt Range</span>
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                    <input type="number" min="0" step="1" value={sqftMin} onChange={(event) => setSqftMin(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Min" />
                    <span className="text-stone-500">to</span>
                    <input type="number" min="0" step="1" value={sqftMax} onChange={(event) => setSqftMax(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Max" />
                  </div>
                  {sqftRangeError ? <span className="text-xs text-red-600">{sqftRangeError}</span> : null}
                </label>

                <input className="border border-stone-300 px-3 py-2 text-sm md:col-span-2" placeholder="Number of Units" />
              </div>
            </div>

            <div className="md:col-span-2 border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-sm font-medium text-stone-900">Floor Plan Info</p>
              <p className="mt-1 text-xs text-stone-600">Add at least two floor plans with core details for listing cards.</p>
              <div className="mt-3 grid gap-3">
                {floorPlans.map((plan, index) => (
                  <div key={`floor-plan-${index}`} className="border border-stone-200 bg-white p-3">
                    <p className="text-xs font-semibold text-stone-800">Floor Plan {index + 1}</p>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <input value={plan.name} onChange={(event) => updateFloorPlan(index, "name", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Plan name" />
                      <select value={plan.availability} onChange={(event) => updateFloorPlan(index, "availability", event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                        <option value="">Availability</option>
                        <option value="Available">Available</option>
                        <option value="Limited">Limited</option>
                        <option value="Sold Out">Sold Out</option>
                      </select>
                      <select value={plan.status} onChange={(event) => updateFloorPlan(index, "status", event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                        <option value="">Status</option>
                        <option value="For sale">For sale</option>
                        <option value="Under construction">Under construction</option>
                        <option value="Sold">Sold</option>
                        <option value="Coming soon">Coming soon</option>
                      </select>
                      <input type="number" min="0" step="1" value={plan.beds} onChange={(event) => updateFloorPlan(index, "beds", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Beds" />
                      <input type="number" min="0" step="1" value={plan.baths} onChange={(event) => updateFloorPlan(index, "baths", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Baths" />
                      <input type="number" min="0" step="1" value={plan.sqft} onChange={(event) => updateFloorPlan(index, "sqft", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="SqFt" />
                      <input type="number" min="0" step="1" value={plan.interiorSize} onChange={(event) => updateFloorPlan(index, "interiorSize", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Interior size (sq ft)" />
                      <input type="number" min="0" step="1" value={plan.balconySize} onChange={(event) => updateFloorPlan(index, "balconySize", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Balcony size (sq ft)" />
                      <input type="number" min="0" step="1" value={plan.startingPrice} onChange={(event) => updateFloorPlan(index, "startingPrice", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Starting price (LKR)" />
                      <input type="number" min="0" step="1" value={plan.averagePricePerSqft} onChange={(event) => updateFloorPlan(index, "averagePricePerSqft", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Average price per SqFt (LKR)" />
                      <label className="grid gap-1 text-xs text-stone-700 md:col-span-2">
                        <span>Upload floor plan image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              updateFloorPlan(index, "image", URL.createObjectURL(file));
                            }
                          }}
                          className="border border-stone-300 bg-white px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-stone-100 file:px-3 file:py-1 file:text-sm"
                        />
                      </label>
                      <input value={plan.image} onChange={(event) => updateFloorPlan(index, "image", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm md:col-span-2" placeholder="Floor plan image URL" />
                      {plan.image ? <Image src={plan.image} alt={`Floor Plan ${index + 1} preview`} width={640} height={320} unoptimized className="h-32 w-full object-contain border border-stone-200 bg-stone-50 md:col-span-2" /> : null}
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" className="mt-3" onClick={addFloorPlan}>Add floor plan</Button>
            </div>

            <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="Number of Floors" />

            <div ref={(element) => { sectionRefs.current[4] = element; }} className="md:col-span-2 mt-2 border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm font-medium text-stone-900">Connected Pages</p>
              <p className="mt-1 text-xs text-stone-600">Choose destination pages used on the public listing when users click these names.</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Builder page (Developer)</span>
                  <select className="border border-stone-300 bg-white px-3 py-2 text-sm">
                    <option value="">No page selected</option>
                    {developers.map((developer) => (
                      <option key={developer.slug} value={developer.slug}>{developer.name}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Architect page</span>
                  <select className="border border-stone-300 bg-white px-3 py-2 text-sm">
                    {architectPageOptions.map((option) => (
                      <option key={option.slug || "architect-none"} value={option.slug}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Sales company page</span>
                  <select className="border border-stone-300 bg-white px-3 py-2 text-sm">
                    {salesCompanyPageOptions.map((option) => (
                      <option key={option.slug || "sales-none"} value={option.slug}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Interior designer page</span>
                  <select className="border border-stone-300 bg-white px-3 py-2 text-sm">
                    {interiorDesignerPageOptions.map((option) => (
                      <option key={option.slug || "interior-none"} value={option.slug}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-stone-700 md:col-span-2">
                  <span>Neighborhood page</span>
                  <select className="border border-stone-300 bg-white px-3 py-2 text-sm">
                    {neighborhoodPageOptions.map((option) => (
                      <option key={option.slug || "neighborhood-none"} value={option.slug}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>
          <div ref={(element) => { sectionRefs.current[5] = element; }} className="border border-lime-200 bg-lime-50 p-3">
            <p className="text-sm font-medium text-stone-900">Gallery</p>
            <p className="mt-1 text-xs text-stone-600">Manage the images shown on the public project page.</p>
            <div className="mt-3"><ImageUploader /></div>
            <div className="mt-4 grid gap-3 border border-lime-200 bg-white p-3">
              <p className="text-sm font-medium text-stone-900">Project Media</p>
              <label className="grid gap-1 text-xs text-stone-700">
                <span>Video URL</span>
                <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="YouTube or Vimeo embed URL" />
              </label>
              <label className="grid gap-1 text-xs text-stone-700">
                <span>Upload video</span>
                <input type="file" accept="video/*" onChange={(event) => setVideoFile(event.target.files?.[0] ? URL.createObjectURL(event.target.files[0]) : "")} className="border border-stone-300 bg-white px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-stone-100 file:px-3 file:py-1 file:text-sm" />
              </label>
              {videoFile ? <video src={videoFile} controls className="max-h-52 w-full bg-stone-900" /> : null}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <p className="text-xs font-medium text-stone-800">Block Plan images</p>
                  {blockPlanImages.map((entry, index) => (
                    <div key={`block-plan-image-${index}`} className="grid gap-2 border border-stone-200 p-2">
                      <input value={entry.label} onChange={(event) => updateMapImage("block", index, "label", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder={`Block plan ${index + 1} name`} />
                      <input type="file" accept="image/*" onChange={(event) => updateUploadedImage(event.target.files?.[0], (value) => updateMapImage("block", index, "image", value))} className="border border-stone-300 bg-white px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-stone-100 file:px-3 file:py-1 file:text-sm" />
                      <input value={entry.image} onChange={(event) => updateMapImage("block", index, "image", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Or paste image URL" />
                      {entry.image ? <Image src={entry.image} alt={`${entry.label || `Block plan ${index + 1}`} preview`} width={640} height={360} unoptimized className="h-28 w-full object-contain bg-stone-50" /> : null}
                      {blockPlanImages.length > 1 ? <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={() => removeMapImage("block", index)}>Remove</Button> : null}
                    </div>
                  ))}
                  <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={() => addMapImage("block")}>Add another Block Plan</Button>
                </div>
                <div className="grid gap-2">
                  <p className="text-xs font-medium text-stone-800">Road Map images</p>
                  {roadMapImages.map((entry, index) => (
                    <div key={`road-map-image-${index}`} className="grid gap-2 border border-stone-200 p-2">
                      <input value={entry.label} onChange={(event) => updateMapImage("road", index, "label", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder={`Road map ${index + 1} name`} />
                      <input type="file" accept="image/*" onChange={(event) => updateUploadedImage(event.target.files?.[0], (value) => updateMapImage("road", index, "image", value))} className="border border-stone-300 bg-white px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-stone-100 file:px-3 file:py-1 file:text-sm" />
                      <input value={entry.image} onChange={(event) => updateMapImage("road", index, "image", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Or paste image URL" />
                      {entry.image ? <Image src={entry.image} alt={`${entry.label || `Road map ${index + 1}`} preview`} width={640} height={360} unoptimized className="h-28 w-full object-contain bg-stone-50" /> : null}
                      {roadMapImages.length > 1 ? <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={() => removeMapImage("road", index)}>Remove</Button> : null}
                    </div>
                  ))}
                  <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={() => addMapImage("road")}>Add another Road Map</Button>
                </div>
              </div>

              <label className="grid gap-1 text-xs text-stone-700">
                <span>Interactive Map URL</span>
                <input value={interactiveMapUrl} onChange={(event) => setInteractiveMapUrl(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Interactive map embed URL" />
              </label>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-stone-800">Virtual Tours</p>
                  <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={addVirtualTour}>Add virtual tour</Button>
                </div>
                {virtualTours.map((tour, index) => (
                  <div key={`virtual-tour-${index}`} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
                    <input value={tour.label} onChange={(event) => updateVirtualTour(index, "label", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Tour name" />
                    <input value={tour.url} onChange={(event) => updateVirtualTour(index, "url", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Virtual tour URL" />
                    <Button type="button" variant="outline" className="h-10 px-3 text-xs" onClick={() => removeVirtualTour(index)}>Remove</Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div ref={(element) => { sectionRefs.current[7] = element; }} className="border border-indigo-200 bg-indigo-50 p-3">
            <p className="text-sm font-medium text-stone-900">Units</p>
            <p className="mt-1 text-xs text-stone-600">Add unit availability and pricing after the project details are complete.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input className="border border-stone-300 bg-white px-3 py-2 text-sm" placeholder="Unit number" />
              <select className="border border-stone-300 bg-white px-3 py-2 text-sm" defaultValue="">
                <option value="">Select unit status</option>
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Sold">Sold</option>
              </select>
            </div>
          </div>
          <div ref={(element) => { sectionRefs.current[8] = element; }} className="border border-teal-200 bg-teal-50 p-3">
            <p className="text-sm font-medium text-stone-900">Contact</p>
            <p className="mt-1 text-xs text-stone-600">Add the sales contact details shown to prospective buyers.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input className="border border-stone-300 bg-white px-3 py-2 text-sm" placeholder="Contact name" />
              <input type="email" className="border border-stone-300 bg-white px-3 py-2 text-sm" placeholder="Email address" />
              <input className="border border-stone-300 bg-white px-3 py-2 text-sm" placeholder="Phone number" />
              <input className="border border-stone-300 bg-white px-3 py-2 text-sm" placeholder="Sales office hours" />
            </div>
          </div>
          <div ref={(element) => { sectionRefs.current[9] = element; }} className="border border-fuchsia-200 bg-fuchsia-50 p-3">
            <p className="text-sm font-medium text-stone-900">SEO</p>
            <p className="mt-1 text-xs text-stone-600">Set the search title and description for the public project page.</p>
            <div className="mt-3 grid gap-3">
              <input className="border border-stone-300 bg-white px-3 py-2 text-sm" placeholder="SEO title" />
              <textarea className="border border-stone-300 bg-white px-3 py-2 text-sm" rows={3} placeholder="SEO description" />
            </div>
          </div>
          <div ref={(element) => { sectionRefs.current[10] = element; }} className="border border-violet-200 bg-violet-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-stone-900">Preview</p>
                <p className="mt-1 text-xs text-stone-600">Review the project details before publishing.</p>
              </div>
              <Button type="button" variant="outline" onClick={() => setPreviewVisible((visible) => !visible)}>
                {previewVisible ? "Hide preview" : "Open preview"}
              </Button>
            </div>
            {previewVisible ? (
              <div className="mt-3 border border-violet-200 bg-white p-3 text-sm">
                <p className="font-semibold">{projectType || "Project type not set"}</p>
                <p className="mt-1 text-stone-600">{[neighborhood, city, district, province].filter(Boolean).join(", ") || "Location not set"}</p>
                <p className="mt-1 text-stone-600">Price range: {normalizedPriceRange}</p>
              </div>
            ) : null}
          </div>
          <div ref={(element) => { sectionRefs.current[11] = element; }} className="border border-orange-200 bg-orange-50 p-3">
            <p className="text-sm font-medium text-stone-900">Publish</p>
            <p className="mt-1 text-xs text-stone-600">Publish this project when all required details have been reviewed.</p>
            <div className="mt-3 flex items-center gap-3">
              <Button type="button" disabled={formHasErrors} onClick={() => setPublishMessage("Project is ready to publish.")}>Publish project</Button>
              {publishMessage ? <p className="text-xs text-emerald-700">{publishMessage}</p> : null}
            </div>
          </div>
          <div className="border border-stone-200 bg-stone-50 p-3 text-xs text-stone-700">
            <p className="font-medium text-stone-900">Live normalized preview</p>
            <div className="mt-2 grid gap-1 md:grid-cols-2">
              <p><strong>Project Type:</strong> {projectType || "Not set"}</p>
              <p><strong>Listing Status:</strong> {projectStatus || "Not set"}</p>
              <p><strong>Move-in Year:</strong> {moveInYear || "Not set"}</p>
              <p><strong>Construction Started:</strong> {constructionStarted || "Not set"}</p>
              <p><strong>Estimated Completion:</strong> {estimatedCompletion || "Not set"}</p>
              <p><strong>Province:</strong> {province || "Not set"}</p>
              <p><strong>District:</strong> {district || "Not set"}</p>
              <p><strong>City:</strong> {city || "Not set"}</p>
              <p><strong>Neighborhood:</strong> {neighborhood || "Not set"}</p>
              <p><strong>Beds:</strong> {normalizedBedRange}</p>
              <p><strong>Baths:</strong> {normalizedBathRange}</p>
              <p><strong>SqFt:</strong> {normalizedSqftRange}</p>
              <p><strong>Price Range:</strong> {normalizedPriceRange}</p>
              <p><strong>Available Unit Price:</strong> {normalizedAvailableRange}</p>
              <p><strong>Price/SqFt:</strong> {pricePerSqft || "Not set"}</p>
              <p><strong>Available Plan Prices:</strong> {normalizedAvailablePlanPrices}</p>
              <p><strong>Pricing:</strong> {pricingComingSoon || "Not set"}</p>
              <p><strong>Average Price/SqFt:</strong> {averagePricePerSqft || "Not set"}</p>
              <p><strong>Monthly Maint/SqFt:</strong> {monthlyMaintenancePerSqft || "Not set"}</p>
              <p><strong>Property Tax:</strong> {propertyTax || "Not set"}</p>
              <p><strong>Parking Cost:</strong> {parkingCost || "Not set"}</p>
              <p><strong>Storage Cost:</strong> {storageCost || "Not set"}</p>
              <p><strong>Co-op Fee Realtors:</strong> {coopFeeRealtors || "Not set"}</p>
              <p><strong>Pricing History:</strong> {(pricingHistoryDate && pricingHistoryNote) ? `${pricingHistoryDate} - ${pricingHistoryNote}` : "Not set"}</p>
              <p><strong>Payment Structure:</strong> {paymentStructure || "Not set"}</p>
              <p><strong>Incentives Count:</strong> {incentives.filter((item) => item.trim()).length}</p>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => selectStep(Math.max(0, step - 1))}>Back</Button>
            <Button disabled={formHasErrors} title={formHasErrors ? "Fix range errors before continuing" : undefined} onClick={() => selectStep(Math.min(steps.length - 1, step + 1))}>Next</Button>
          </div>
        </div>

        <aside className="space-y-3 border border-stone-200 bg-white p-4 lg:sticky lg:top-4 lg:h-fit">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-stone-900">Icon Info Visibility</h3>
            <p className="text-xs text-stone-600">Choose which details appear in the listing icon stats. Maximum 10 items.</p>
          </div>
          <p className={`text-xs font-medium ${visibleStats.length === maxVisibleStats ? "text-amber-700" : "text-stone-600"}`}>
            {visibleStats.length}/{maxVisibleStats} selected
          </p>
          <ul className="grid gap-2">
            {statOptions.map((stat) => {
              const isChecked = visibleStats.includes(stat);
              const canSelect = isChecked || visibleStats.length < maxVisibleStats;

              return (
                <li key={stat}>
                  <button
                    type="button"
                    onClick={() => toggleStat(stat)}
                    disabled={!canSelect}
                    className={`flex w-full items-center justify-between border px-3 py-2 text-left text-sm ${isChecked ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-stone-900"} ${!canSelect ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <span>{stat}</span>
                    <span className="text-xs font-semibold">{isChecked ? "ON" : "OFF"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {visibleStats.length === maxVisibleStats ? <p className="text-xs text-amber-700">Maximum reached. Turn one item OFF to enable another.</p> : null}
          <div className="border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs font-medium text-stone-700">Selected for icons</p>
            <p className="mt-1 text-xs text-stone-600">{visibleStats.join(" • ")}</p>
          </div>
        </aside>
        </div>
    </section>
  );
}
