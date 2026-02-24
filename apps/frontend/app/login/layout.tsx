import { Metadata } from "next";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main>{children}</main>;
}

export const metadata: Metadata = {
  title: "MyAmministratore - Login",
  description: "Accedi al pannello di amministrazione MySagra",
};
