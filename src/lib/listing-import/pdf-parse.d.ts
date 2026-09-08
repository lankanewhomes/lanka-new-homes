// pdf-parse's package entry runs a self-test that reads a fixture file when
// bundled, so the importer loads lib/pdf-parse.js directly; the published
// types only cover the package root.
declare module "pdf-parse/lib/pdf-parse.js" {
  import type pdfParse from "pdf-parse";
  const parse: typeof pdfParse;
  export default parse;
}
