import { useLocation } from "wouter";
import { Navigation } from "@/components/navigation";
import { RegistrationForm } from "@/components/registration-form";

export default function RegisterPage() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const defaultCategoryId = urlParams.get("category") || undefined;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Bull Pair Registration</h1>
            <p className="text-muted-foreground">
              Complete the form below to register your bull pair for an upcoming race.
            </p>
          </div>

          <RegistrationForm defaultCategoryId={defaultCategoryId} />
        </div>
      </main>
    </div>
  );
}
