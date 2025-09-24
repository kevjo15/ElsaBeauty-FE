import { LoginForm } from "@/components/login-form";
import ModeToggle from "@/components/mode-toggle";

export default function Page() {
  return (
    <div className="flex flex-col items-center min-h-screen p-4">
      {/* ModeToggle placerad högst upp i högra hörnet */}
      <div className="ml-auto w-full max-w-md">
        <div className="flex justify-end mb-4">
          <ModeToggle />
        </div>
      </div>

      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
