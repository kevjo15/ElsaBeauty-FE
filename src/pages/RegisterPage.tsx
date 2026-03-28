"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import ModeToggle from "@/components/mode-toggle";
import { registerUser } from "@/services/api/authService";

const formSchema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: "First name must be at least 2 characters." }),
    lastName: z
      .string()
      .min(2, { message: "Last name must be at least 2 characters." }),
    email: z.string().email({ message: "Invalid email address." }),
    phoneNumber: z
      .string()
      .regex(/^\+?[0-9\s\-\(\)]{7,15}$/, { message: "Phone number is not valid." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
      .regex(/[0-9]/, { message: "Password must contain at least one digit." })
      .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

type FormValues = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await registerUser(values);
      navigate("/login");
    } catch (error) {
      if (error instanceof Error) {
        setServerError(error.message);
      } else {
        setServerError("Registration failed. Please try again.");
      }
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4">
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

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="label">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    placeholder="John"
                    className="input input-bordered w-full"
                    disabled={form.formState.isSubmitting}
                    {...form.register("firstName")}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-error text-sm mt-1">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="label">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    placeholder="Doe"
                    className="input input-bordered w-full"
                    disabled={form.formState.isSubmitting}
                    {...form.register("lastName")}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-error text-sm mt-1">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="label">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="johndoe@mail.com"
                    autoComplete="email"
                    className="input input-bordered w-full"
                    disabled={form.formState.isSubmitting}
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-error text-sm mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phoneNumber" className="label">
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+46 70 123 45 67"
                    autoComplete="tel"
                    className="input input-bordered w-full"
                    disabled={form.formState.isSubmitting}
                    {...form.register("phoneNumber")}
                  />
                  {form.formState.errors.phoneNumber && (
                    <p className="text-error text-sm mt-1">
                      {form.formState.errors.phoneNumber.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="label">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    className="input input-bordered w-full"
                    disabled={form.formState.isSubmitting}
                    {...form.register("password")}
                  />
                  {form.formState.errors.password && (
                    <p className="text-error text-sm mt-1">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="label">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className="input input-bordered w-full"
                    disabled={form.formState.isSubmitting}
                    {...form.register("confirmPassword")}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-error text-sm mt-1">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Server error */}
                {serverError && (
                  <p className="text-error text-sm text-center">{serverError}</p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Registering...
                    </>
                  ) : (
                    "Register"
                  )}
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
