import React from "react";
import type { Employee } from "@/services/api/types";
import { User } from "lucide-react";

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedEmployee: Employee | null;
  onEmployeeChange: (employee: Employee) => void;
  loading: boolean;
  title: string;
}

const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  employees,
  selectedEmployee,
  onEmployeeChange,
  loading,
  title,
}) => {
  if (loading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body items-center p-6">
          <span className="loading loading-spinner loading-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body items-center p-6">
        <h2 className="card-title text-center text-2xl font-bold">{title}</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Välj vilken medarbetare du vill boka hos
        </p>
        {employees.length === 0 && (
          <p className="text-sm text-base-content/50">Inga medarbetare tillgängliga just nu.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {employees.map((emp) => {
            const name = [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.email;
            const isSelected = selectedEmployee?.id === emp.id;
            return (
              <div
                key={emp.id}
                className={`card bg-base-200 shadow-md cursor-pointer transition-all duration-200 ease-in-out ${
                  isSelected
                    ? "border-2 border-primary shadow-lg scale-[1.02]"
                    : "border border-base-300 hover:shadow-lg hover:scale-[1.01]"
                }`}
                onClick={() => onEmployeeChange(emp)}
              >
                <div className="card-body p-4 flex-row items-center gap-4">
                  <div className="rounded-full w-12 h-12 bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <User className="h-6 w-6" />
                  </div>
                  <p className="font-semibold">{name}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EmployeeSelector;
