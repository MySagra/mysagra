import Header from "@/components/layout/header";

export default function Layout({ children }: { children: React.ReactNode }) {
    return(
        <main>
            <Header />
            { children }
        </main>
    )
}