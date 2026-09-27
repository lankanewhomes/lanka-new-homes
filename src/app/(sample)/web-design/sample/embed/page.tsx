import { SampleSite } from "@/components/web-design-sample/sample-site";

// The same sample without the "this is a sample" bar — what the device frames
// on /web-design load (an iframe of the real page, so it never goes out of date).
export default function SampleEmbedPage() {
  return <SampleSite embedded />;
}
