"use client";

import { Link } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import ModeToggle from "@/components/mode-toggle";

// Define validation schema using Zod
const formSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters long" }),
    email: z.string().email({ message: "Invalid email address" }),
    phone: z.string().min(10, { message: "Phone number must be valid" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters long" })
      .regex(/[a-zA-Z0-9]/, { message: "Password must be alphanumeric" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export default function RegisterPreview() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Assuming an async registration function
      console.log(values);
      toast(
        <pre className="mt-2 w-[340px] rounded-md bg-base-300 p-4">
          <code className="text-base-content">
            {JSON.stringify(values, null, 2)}
          </code>
        </pre>
      );
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4">
      {/* ModeToggle placerad högst upp i högra hörnet */}
      <div className="ml-auto w-full max-w-md">
        <div className="flex justify-end mb-4">
          <ModeToggle />
        </div>
      </div>

      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="card bg-base-100 shadow-xl mx-auto max-w-sm">
          <div className="card-body">
            <h2 className="card-title text-2xl">Register</h2>
            <p className="text-base-content">
              Create a new account by filling out the form below.
            </p>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-4">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="label">
                    Full Name
                  </label>
                  <input
                    id="name"
                    placeholder="John Doe"
                    className="input input-bordered w-full"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-error text-sm mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="label">
                    Email
                  </label>
                  <input
                    id="email"
                    placeholder="johndoe@mail.com"
                    type="email"
                    autoComplete="email"
                    className="input input-bordered w-full"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-error text-sm mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label htmlFor="phone" className="label">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    placeholder="555-123-4567"
                    type="tel"
                    autoComplete="tel"
                    className="input input-bordered w-full"
                    {...form.register("phone")}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-error text-sm mt-1">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                  {/* TODO: Re-integrate react-phone-number-input or find a DaisyUI alternative */}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="label">
                    Password
                  </label>
                  <input
                    id="password"
                    placeholder="******"
                    type="password"
                    autoComplete="new-password"
                    className="input input-bordered w-full"
                    {...form.register("password")}
                  />
                  {form.formState.errors.password && (
                    <p className="text-error text-sm mt-1">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="label">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    placeholder="******"
                    type="password"
                    autoComplete="new-password"
                    className="input input-bordered w-full"
                    {...form.register("confirmPassword")}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-error text-sm mt-1">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button type="submit" className="btn btn-primary w-full">
                  Register
                </button>
              </div>
            </form>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="underline">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
