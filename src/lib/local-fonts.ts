import localFont from "next/font/local";

// Fonts are self-hosted (downloaded once from Google Fonts into src/fonts) so a build never has to reach Google. The old
// next/font/google fetch failed intermittently ("Cannot read properties of null (reading '1')") on GitHub CI and always on
// Cloudflare builds (2026-10-07). Latin subset only, same weights/styles as before.

export const archivoSite = localFont({
  src: [
    { path: "../fonts/archivo-normal-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/archivo-normal-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/archivo-normal-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/archivo-normal-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-avenir-trial",
  display: "swap",
});

export const cormorantSample = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-italic-400.woff2", weight: "400", style: "italic" },
    { path: "../fonts/cormorant-garamond-italic-500.woff2", weight: "500", style: "italic" },
    { path: "../fonts/cormorant-garamond-italic-600.woff2", weight: "600", style: "italic" },
    { path: "../fonts/cormorant-garamond-normal-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cormorant-garamond-normal-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/cormorant-garamond-normal-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--smp-font-display",
  display: "swap",
});

export const dmSansSample = localFont({
  src: [
    { path: "../fonts/dm-sans-normal-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/dm-sans-normal-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/dm-sans-normal-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--smp-font-body",
  display: "swap",
});

export const spaceGroteskMeridian = localFont({
  src: [
    { path: "../fonts/space-grotesk-normal-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/space-grotesk-normal-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/space-grotesk-normal-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--smp-font-display",
  display: "swap",
});

export const interMeridian = localFont({
  src: [
    { path: "../fonts/inter-normal-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/inter-normal-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/inter-normal-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--smp-font-body",
  display: "swap",
});

export const poppinsWillow = localFont({
  src: [
    { path: "../fonts/poppins-normal-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/poppins-normal-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--smp-font-display",
  display: "swap",
});

export const sourceSansWillow = localFont({
  src: [
    { path: "../fonts/source-sans-3-normal-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/source-sans-3-normal-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/source-sans-3-normal-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--smp-font-body",
  display: "swap",
});

export const frauncesAzure = localFont({
  src: [
    { path: "../fonts/fraunces-italic-400.woff2", weight: "400", style: "italic" },
    { path: "../fonts/fraunces-italic-500.woff2", weight: "500", style: "italic" },
    { path: "../fonts/fraunces-italic-600.woff2", weight: "600", style: "italic" },
    { path: "../fonts/fraunces-normal-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/fraunces-normal-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/fraunces-normal-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--smp-font-display",
  display: "swap",
});

export const workSansAzure = localFont({
  src: [
    { path: "../fonts/work-sans-normal-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/work-sans-normal-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/work-sans-normal-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--smp-font-body",
  display: "swap",
});

export const archivoObsidian = localFont({
  src: [
    { path: "../fonts/archivo-normal-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/archivo-normal-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--smp-font-display",
  display: "swap",
});

export const manropeObsidian = localFont({
  src: [
    { path: "../fonts/manrope-normal-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/manrope-normal-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/manrope-normal-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--smp-font-body",
  display: "swap",
});

export const newsreaderHighgrove = localFont({
  src: [
    { path: "../fonts/newsreader-italic-400.woff2", weight: "400", style: "italic" },
    { path: "../fonts/newsreader-italic-500.woff2", weight: "500", style: "italic" },
    { path: "../fonts/newsreader-italic-600.woff2", weight: "600", style: "italic" },
    { path: "../fonts/newsreader-normal-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/newsreader-normal-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/newsreader-normal-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--smp-font-display",
  display: "swap",
});

export const karlaHighgrove = localFont({
  src: [
    { path: "../fonts/karla-normal-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/karla-normal-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/karla-normal-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--smp-font-body",
  display: "swap",
});

export const frauncesHome = localFont({
  src: [
    { path: "../fonts/fraunces-italic-400.woff2", weight: "400", style: "italic" },
    { path: "../fonts/fraunces-italic-500.woff2", weight: "500", style: "italic" },
    { path: "../fonts/fraunces-italic-600.woff2", weight: "600", style: "italic" },
    { path: "../fonts/fraunces-normal-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/fraunces-normal-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/fraunces-normal-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-v2-display",
  display: "swap",
});

export const interHome = localFont({
  src: [
    { path: "../fonts/inter-normal-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/inter-normal-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/inter-normal-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/inter-normal-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-v2-body",
  display: "swap",
});
