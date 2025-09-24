import React from "react";
import MainLayout from "@/components/layout/main-layout";

const TestPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">DaisyUI Test Page</h1>

        {/* Test Buttons */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn">Default</button>
            <button className="btn btn-primary">Primary</button>
            <button className="btn btn-secondary">Secondary</button>
            <button className="btn btn-accent">Accent</button>
            <button className="btn btn-ghost">Ghost</button>
            <button className="btn btn-outline">Outline</button>
          </div>
        </div>

        {/* Test Cards */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Card Title</h2>
                <p>This is a test card to verify DaisyUI styling.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary">Action</button>
                </div>
              </div>
            </div>

            <div className="card bg-primary text-primary-content">
              <div className="card-body">
                <h2 className="card-title">Primary Card</h2>
                <p>This card should have primary theme colors.</p>
                <div className="card-actions justify-end">
                  <button className="btn">Action</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Badges */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <div className="badge">Default</div>
            <div className="badge badge-primary">Primary</div>
            <div className="badge badge-secondary">Secondary</div>
            <div className="badge badge-accent">Accent</div>
            <div className="badge badge-ghost">Ghost</div>
          </div>
        </div>

        {/* Test Alerts */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Alerts</h2>
          <div className="space-y-2">
            <div className="alert alert-info">
              <span>Info alert - This should show cupcake theme colors!</span>
            </div>
            <div className="alert alert-success">
              <span>Success alert - Check the colors!</span>
            </div>
            <div className="alert alert-warning">
              <span>Warning alert - Are the colors correct?</span>
            </div>
            <div className="alert alert-error">
              <span>Error alert - Theme verification!</span>
            </div>
          </div>
        </div>

        {/* Current Theme Display */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Theme Info</h2>
          <div className="mockup-code">
            <pre data-prefix="$">
              <code>
                Current data-theme:{" "}
                {document.documentElement.getAttribute("data-theme") || "none"}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TestPage;
