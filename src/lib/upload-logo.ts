export async function uploadLogo(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/uploads/logo", { method: "POST", body: formData });
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.url) {
    throw new Error(data?.error ?? "Unable to upload logo.");
  }

  return data.url as string;
}
