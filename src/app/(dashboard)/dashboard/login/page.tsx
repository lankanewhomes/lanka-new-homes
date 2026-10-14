import type { Metadata } from "next";
import { LoginCard } from "../_components/LoginCard";

export const metadata: Metadata = { title: "Sign in" };
export default function LoginPage() { return <LoginCard />; }
