import React, { useState } from "react";
import { usePlanStore } from "../store/planStore";
import { makePlan } from "../lib/factories";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";

function PlanForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(
      makePlan({
        name: formData.name,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      }),
    );
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    });
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">Add New Plan</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="form-input"
              placeholder="Enter plan name"
              required
            />
          </div>
          <div>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="form-input"
              required
            />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className="form-input"
              required
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PlanSelector() {
  const { plans, addPlan, setCurrentPlanId, currentPlanId, removePlan } =
    usePlanStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddPlan = (plan) => {
    addPlan(plan);
    setIsModalOpen(false);
  };

  return (
    <div className="py-4">
      <div className="sm:hidden">
        <div className="flex space-x-2 mb-2">
          <select
            className="form-select flex-grow"
            value={currentPlanId || ""}
            onChange={(e) => setCurrentPlanId(e.target.value)}
          >
            <option value="">Select a plan</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} {currentPlanId === plan.id ? "(current)" : ""}
              </option>
            ))}
          </select>
          <div className="flex space-x-2">
            {currentPlanId && (
              <button
                type="button"
                onClick={() => {
                  const plan = plans.find((p) => p.id === currentPlanId);
                  if (
                    window.confirm(
                      `Delete plan "${plan.name}" and all its data?`,
                    )
                  ) {
                    setCurrentPlanId(null);
                    removePlan(plan.id);
                  }
                }}
                className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100"
                title="Delete current plan"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center p-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
              title="Add new plan"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      <div className="hidden sm:block">
        <nav className="flex space-x-4" aria-label="Plans">
          {plans.map((plan) => (
            <div key={plan.id} className="flex items-center">
              <button
                onClick={() => setCurrentPlanId(plan.id)}
                className={`
                  px-3 py-2 rounded-md text-sm font-medium
                  ${
                    currentPlanId === plan.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }
                `}
              >
                {plan.name}
              </button>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete plan "${plan.name}" and all its data?`,
                    )
                  ) {
                    if (currentPlanId === plan.id) {
                      setCurrentPlanId(null);
                    }
                    removePlan(plan.id);
                  }
                }}
                className="ml-2 p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                title="Delete plan"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            New Plan
          </button>
        </nav>
      </div>
      {isModalOpen && (
        <PlanForm
          onSubmit={handleAddPlan}
          onCancel={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
