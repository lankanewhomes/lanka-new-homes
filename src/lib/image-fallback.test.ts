import { describe, expect, it } from "vitest";
import { sizedSourceUrl, withImageFallback } from "../../cloudflare/image-fallback.js";
import { sizedKey, sizedWidthFor } from "../../cloudflare/image-sizes.js";

// The worker's /_next/image handling: ready-shrunk copy from storage, then the optimizer, then the original.

const MEDIA = "https://media.lankanewhomes.com/projects/kelsey-palace/floor-plans/unit%20a-3d.jpg";
const imageUrl = (src: string, w = 640) => `https://www.lankanewhomes.com/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;
const image = (body: string, type = "image/webp") => new Response(body, { status: 200, headers: { "content-type": type } });
const missing = () => new Response("not found", { status: 404, headers: { "content-type": "text/plain" } });

/** A fake media host: answers from `files`, 404 otherwise, and records what was asked for. */
function mediaHost(files: Record<string, () => Response>) {
  const asked: string[] = [];
  const fetchImpl = async (input: RequestInfo | URL) => {
    const url = String(input);
    asked.push(url);
    return (files[url] ?? missing)();
  };
  return { asked, fetchImpl };
}

describe("sizedWidthFor", () => {
  it("picks the smallest stored width that covers the request", () => {
    expect(sizedWidthFor(16)).toBe(128);
    expect(sizedWidthFor(128)).toBe(128);
    expect(sizedWidthFor(256)).toBe(384);
    expect(sizedWidthFor(640)).toBe(640);
    expect(sizedWidthFor(750)).toBe(1080);
    expect(sizedWidthFor(1200)).toBe(1920);
  });
  it("uses the biggest width for anything larger or unreadable", () => {
    expect(sizedWidthFor(3840)).toBe(1920);
    expect(sizedWidthFor(null)).toBe(1920);
    expect(sizedWidthFor("abc")).toBe(1920);
  });
});

describe("sizedSourceUrl", () => {
  it("maps a media photo to its shrunk copy, keeping the path encoding", () => {
    expect(sizedSourceUrl(imageUrl(MEDIA, 750))).toBe(
      "https://media.lankanewhomes.com/_sized/w1080/projects/kelsey-palace/floor-plans/unit%20a-3d.jpg.webp",
    );
  });
  it("matches the key the presize script writes", () => {
    const url = new URL(sizedSourceUrl(imageUrl(MEDIA, 640))!);
    expect(decodeURIComponent(url.pathname.slice(1))).toBe(sizedKey("projects/kelsey-palace/floor-plans/unit a-3d.jpg", 640));
  });
  it("is null for other hosts, bundled assets, SVGs, GIFs and copies themselves", () => {
    expect(sizedSourceUrl(imageUrl("https://example.com/x.jpg"))).toBeNull();
    expect(sizedSourceUrl("https://www.lankanewhomes.com/_next/image?url=%2Flogo.png&w=64&q=75")).toBeNull();
    expect(sizedSourceUrl(imageUrl("https://media.lankanewhomes.com/plans/a.svg"))).toBeNull();
    expect(sizedSourceUrl(imageUrl("https://media.lankanewhomes.com/a.gif"))).toBeNull();
    expect(sizedSourceUrl(imageUrl("https://media.lankanewhomes.com/_sized/w640/a.jpg.webp"))).toBeNull();
    expect(sizedSourceUrl("https://www.lankanewhomes.com/projects/x")).toBeNull();
  });
});

describe("withImageFallback", () => {
  const sized640 = "https://media.lankanewhomes.com/_sized/w640/projects/kelsey-palace/floor-plans/unit%20a-3d.jpg.webp";

  it("serves the shrunk copy without calling the optimizer", async () => {
    const host = mediaHost({ [sized640]: () => image("small") });
    let optimizerCalls = 0;
    const res = await withImageFallback(new Request(imageUrl(MEDIA)), async () => (optimizerCalls++, image("opt")), host.fetchImpl);
    expect(res.status).toBe(200);
    expect(res.headers.get("x-image-source")).toBe("presized");
    expect(res.headers.get("content-type")).toBe("image/webp");
    expect(await res.text()).toBe("small");
    expect(optimizerCalls).toBe(0);
    expect(host.asked).toEqual([sized640]);
  });

  it("uses the optimizer when there is no copy yet", async () => {
    const host = mediaHost({});
    const res = await withImageFallback(new Request(imageUrl(MEDIA)), async () => image("opt"), host.fetchImpl);
    expect(await res.text()).toBe("opt");
    expect(res.headers.get("x-image-source")).toBeNull();
    expect(host.asked).toEqual([sized640]);
  });

  it("falls back to the original when there is no copy and the optimizer refuses", async () => {
    const host = mediaHost({ [MEDIA]: () => image("original", "image/jpeg") });
    const res = await withImageFallback(new Request(imageUrl(MEDIA)), async () => new Response("Blocked", { status: 403 }), host.fetchImpl);
    expect(res.status).toBe(200);
    expect(res.headers.get("x-image-fallback")).toBe("original");
    expect(await res.text()).toBe("original");
  });

  it("falls back to the original when the optimizer throws", async () => {
    const host = mediaHost({ [MEDIA]: () => image("original", "image/jpeg") });
    const res = await withImageFallback(
      new Request(imageUrl(MEDIA)),
      async () => {
        throw new Error("IMAGES_TRANSFORM_ERROR 9422");
      },
      host.fetchImpl,
    );
    expect(await res.text()).toBe("original");
  });

  it("survives the media host being down", async () => {
    const down = async () => {
      throw new Error("network");
    };
    const refused = await withImageFallback(new Request(imageUrl(MEDIA)), async () => new Response("Blocked", { status: 403 }), down);
    expect(refused.status).toBe(403);
    const crashed = await withImageFallback(
      new Request(imageUrl(MEDIA)),
      async () => {
        throw new Error("boom");
      },
      down,
    );
    expect(crashed.status).toBe(502);
  });

  it("skips the copy for a client that does not take WebP", async () => {
    const host = mediaHost({ [sized640]: () => image("small") });
    const request = new Request(imageUrl(MEDIA), { headers: { accept: "image/jpeg,image/png" } });
    const res = await withImageFallback(request, async () => image("opt", "image/jpeg"), host.fetchImpl);
    expect(await res.text()).toBe("opt");
    expect(host.asked).toEqual([]);
  });

  it("leaves other requests and other hosts alone", async () => {
    const host = mediaHost({});
    const page = await withImageFallback(new Request("https://www.lankanewhomes.com/x"), async () => new Response("no", { status: 500 }), host.fetchImpl);
    expect(page.status).toBe(500);
    const other = await withImageFallback(
      new Request(imageUrl("https://example.com/x.jpg")),
      async () => new Response("Blocked", { status: 403 }),
      host.fetchImpl,
    );
    expect(other.status).toBe(403);
    expect(host.asked).toEqual([]);
  });
});
