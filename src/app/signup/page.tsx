import RegisterPage from "@/components/register";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar - nyoo.me",
  description: "Create a new nyoo.me account",
};

export default function Signup() {
  return <RegisterPage />;
}