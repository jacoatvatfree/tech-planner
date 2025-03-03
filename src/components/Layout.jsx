import React from "react";
import { Link, Outlet } from "react-router-dom";
import {
  HomeIcon,
  UserGroupIcon,
  ClipboardIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import PlanSelector from "./PlanSelector";
import { usePlanStore } from "../store/planStore";

const getNavigation = (hasPlan) => [
  { name: "Dashboard", href: "/", icon: HomeIcon, alwaysShow: true },
  { name: "Team", href: "/team", icon: UserGroupIcon, alwaysShow: false },
  {
    name: "Projects",
    href: "/projects",
    icon: ClipboardIcon,
    alwaysShow: false,
  },
  {
    name: "Schedule",
    href: "/schedule",
    icon: CalendarIcon,
    alwaysShow: false,
  },
];

function Layout() {
  const { currentPlanId, initializeFromStorage } = usePlanStore();
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    initializeFromStorage();
    setIsInitialized(true);
  }, [initializeFromStorage]);

  const navigation = getNavigation().filter(
    (item) => item.alwaysShow || currentPlanId,
  );

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <span className="text-xl font-bold text-gray-900">
                  Resource Planner
                </span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                  >
                    <item.icon className="h-5 w-5 mr-1" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="border-b border-gray-200 bg-white print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PlanSelector />
        </div>
      </div>

      <main className="py-10">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {currentPlanId ? (
            <Outlet />
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">
                No Plan Selected
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Please select or create a plan to get started.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Layout;
