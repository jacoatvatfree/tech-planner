import React from "react";
import { Link, Outlet } from "react-router-dom";
import {
  HomeIcon,
  UserGroupIcon,
  ClipboardIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import PlanSelector from "./PlanSelector";

const navigation = [
  { name: "Dashboard", href: "/", icon: HomeIcon },
  { name: "Team", href: "/engineers", icon: UserGroupIcon },
  { name: "Projects", href: "/projects", icon: ClipboardIcon },
  { name: "Schedule", href: "/schedule", icon: CalendarIcon },
];

function Layout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
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

      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PlanSelector />
        </div>
      </div>

      <main className="py-10">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
