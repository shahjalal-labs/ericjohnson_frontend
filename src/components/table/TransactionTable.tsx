"use client";

import { ChevronLeft, ChevronRight, MessageCircleQuestion } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Employee {
  id: string;
  userName: string;
  transactionId: string;
  phoneNumber: string;
  userEmail: string;
  transactionDate: string;
  paymentType: string;
  paymentMethod: string;
  createdAt: string;
  notes?: string;
  description?: string;
  customerName: string;
  date: number;
}

interface EmployeeTableProps {
  employees: Employee[];
  currentPage: number;
  itemsPerPage: string;
  totalItems: number;
  totalPages: number;
  searchQuery: string;
  isLoading: boolean;
  setSearchQuery: (query: string) => void;
  setItemsPerPage: (value: string) => void;
  setCurrentPage: (page: number) => void;
}

export default function TransactionTable({
  employees,
  currentPage,
  itemsPerPage,
  totalItems,
  totalPages,

  setItemsPerPage,
  setCurrentPage,
  isLoading,
}: EmployeeTableProps) {
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const selectRef = useRef<HTMLDivElement>(null);

  // Page change handler
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

  // Open the modal with employee's notes and description
  const openModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  // Close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="">
              <th className="text-center py-3 px-4 font-medium text-gray-700 w-[200px]">
                #
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700 w-[200px]">
                Customer Name
              </th>

              <th className="text-center py-3 px-4 font-medium text-gray-700">
                Date
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">
                Transaction Id
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">
                Payment Method
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">
                Payment Status
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">
                Documents
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse hover:bg-gray-50">
                    <td className="py-3 px-4 text-center">
                      <div className="h-4 w-6 mx-auto bg-gray-200 rounded" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="h-4 w-24 mx-auto bg-gray-200 rounded" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="h-4 w-20 mx-auto bg-gray-200 rounded" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="h-4 w-24 mx-auto bg-gray-200 rounded" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="h-4 w-28 mx-auto bg-gray-200 rounded" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="h-8 w-24 mx-auto bg-gray-200 rounded-full" />
                    </td>
                  </tr>
                ))
              : employees?.map((employee, index) => (
                  <tr key={index} className=" hover:bg-gray-50">
                    <td className="py-3 text-center px-4">{index + 1}</td>
                    <td className="py-3 text-center px-4">
                      {employee?.customerName}
                    </td>

                    <td className="py-3 text-center px-4">
                      {new Date(employee.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3 text-center px-4">
                      {employee.transactionId}
                    </td>
                    <td className="py-3 text-center px-4">
                      {employee.paymentMethod}
                    </td>
                    <td className="py-3 text-center px-4">
                      <button className={`rounded-full px-4 py-1 text-sm`}>
                        {employee?.paymentType.split("_").join(" ")}
                      </button>
                    </td>
                    <td className="py-3 text-center px-4">
                      <button
                        onClick={() => openModal(employee)}
                        className={`rounded-full px-4 py-1 text-sm`}
                      >
                        <MessageCircleQuestion />
                      </button>
                    </td>
                  </tr>
                ))}
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

      {/* Modal (Custom Design) */}
      {isModalOpen && selectedEmployee && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl mx-4">
            <h3 className="text-xl font-semibold mb-4">Employee Notes</h3>
            <div className="mb-4">
              {/* <h4 className="font-medium">
                Name: {selectedEmployee?.userName}
              </h4> */}
              <p className="text-sm">
                Notes: {selectedEmployee?.notes || "N/A"}
              </p>
              <p className="text-sm mt-2">
                Description: {selectedEmployee?.description}
              </p>
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={closeModal}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
