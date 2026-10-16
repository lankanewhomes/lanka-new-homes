import type { Metadata } from "next";
import { CreatePostPage } from "../../../_components/CreatePostPage";

export const metadata: Metadata = { title: "Create a social post" };
export default function Page() { return <CreatePostPage />; }
