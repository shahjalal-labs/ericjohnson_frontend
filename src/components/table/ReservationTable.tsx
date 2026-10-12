"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Employee {
  id: string;
  name: string;
  joiningDate: string;
  phoneNumber: string;
  email: string;
  status: string; // Added status property
  user?: {
    name: string;
  };
  service?: {
    name: string;
    id: string;
  };
}

interface EmployeeTableProps {
  employees: Employee[];
  currentPage: number;
  itemsPerPage: string;
  totalItems: number;
  totalPages: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setItemsPerPage: (value: string) => void;
  setCurrentPage: (page: number) => void;
}

export default function ReservationTable({
  employees,
  currentPage,
  itemsPerPage,
  totalItems,
  totalPages,
  setItemsPerPage,
  setCurrentPage,
}: EmployeeTableProps) {
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const [sortByStatus, setSortByStatus] = useState("");

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Close select dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsSelectOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "assigned_employee":
        return {
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-600",
        };
      case "in_progress":
        return {
          bgColor: "bg-blue-100",
          textColor: "text-blue-600",
        };
      case "completed":
        return {
          bgColor: "bg-green-100",
          textColor: "text-green-600",
        };
      default:
        return {
          bgColor: "bg-gray-100",
          textColor: "text-gray-600",
        };
    }
  };

  const sortEmployees = (status: string) => {
    if (!status) return employees; // No sorting if no status is selected
    return employees?.filter((employee) => employee.status === status);
  };

  // Sorted employees based on selected status
  const sortedEmployees = sortEmployees(sortByStatus);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-medium">Jobs Overview</h1>
        </div>
        <div className="flex items-center gap-2">
          <h1>Sort By:</h1>
          <select
            className=" p-2 border rounded"
            onChange={(e) => setSortByStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="assigned_employee">Assigned Employee</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="">
              <th className="text-center py-3 px-4 font-medium text-gray-700 w-[200px]">
                Client Name
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">
                Job Type
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">
                Job Id
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">
                Status
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedEmployees?.map((employee, index) => {
              const { bgColor, textColor } = getStatusStyles(employee.status);
              return (
                <tr key={index} className=" hover:bg-gray-50">
                  <td className="py-3 text-center px-4">
                    {employee?.user?.name}
                  </td>
                  <td className="py-3 text-center px-4">
                    {employee.service?.name}
                  </td>
                  <td className="py-3 text-center px-4">
                    {employee.service?.id}
                  </td>
                  <td className="py-3 text-center px-4">
                    <span
                      className={`inline-block px-4 py-1 rounded-full text-sm ${bgColor} ${textColor}`}
                    >
                      {employee.status}
                    </span>
                  </td>
                  <td className="py-3 text-center px-4 text-blue-500">
                    <Link href={`/customer/single-reservation/${employee?.id}`}>
                      View Details
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Show</span>
          <div className="relative" ref={selectRef}>
            <button
              className="w-16 px-3 py-1 border border-gray-300 rounded-md flex items-center justify-between bg-white"
              onClick={() => setIsSelectOpen(!isSelectOpen)}
            >
              <span>{itemsPerPage}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 transition-transform ${
                  isSelectOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isSelectOpen && (
              <div className="absolute top-full left-0 mt-1 w-16 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                {["6", "10", "20", "50"].map((value) => (
                  <div
                    key={value}
                    className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setItemsPerPage(value);
                      setIsSelectOpen(false);
                      setCurrentPage(1);
                    }}
                  >
                    {value}
                  </div>
                ))}
              </div>
            )}
          </div>
          <span className="text-sm text-gray-500">from {totalItems}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            className={`h-8 w-8 rounded-md flex items-center justify-center border ${
              currentPage === 1
                ? "text-gray-400 border-gray-200"
                : "border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {[...Array(totalPages).keys()].map((page) => (
            <button
              key={page + 1}
              className={`h-8 w-8 rounded-md flex items-center justify-center ${
                currentPage === page + 1
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => handlePageChange(page + 1)}
            >
              {page + 1}
            </button>
          ))}

          <span className="mx-1">...</span>

          <button
            className="h-8 w-8 rounded-md flex items-center justify-center border border-gray-300 hover:bg-gray-50"
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </button>

          <button
            className={`h-8 w-8 rounded-md flex items-center justify-center border ${
              currentPage === totalPages
                ? "text-gray-400 border-gray-200"
                : "border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
