import React, { useState } from 'react';
import { useLabInvoiceStore } from '../../stores/labInvoiceStore';
import { useGlobalSettingsStore } from '../../stores/globalSettingsStore';
import { Search, Eye } from 'lucide-react';
import type { LabInvoice } from '../../types';

interface LabInvoiceListProps {
  invoices?: LabInvoice[];
  onViewInvoice?: (invoice: LabInvoice) => void;
}

export const LabInvoiceList: React.FC<LabInvoiceListProps> = ({ 
  invoices: propInvoices, 
  onViewInvoice 
}) => {
  const { invoices: storeInvoices, updateInvoice } = useLabInvoiceStore();
  const { labName, labLogo } = useGlobalSettingsStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Use prop invoices if provided, otherwise use store invoices
  const invoices = propInvoices || storeInvoices;

  const filteredInvoices = invoices
    .filter(invoice => {
      // Ensure invoice has all required properties
      if (!invoice || !invoice.patientName || !invoice.id) return false;

      return (
        invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.prescriptionId && invoice.prescriptionId.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const renderStatus = (status: string) => {
    switch (status) {
      case 'printed':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Printed
          </span>
        );
      case 'saved':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Saved
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const renderActionButtons = (invoice: LabInvoice) => {
    return (
      <div className="flex space-x-2">
        <button
          onClick={() => onViewInvoice(invoice)}
          className="text-indigo-600 hover:text-indigo-900"
          title="View Invoice"
        >
          <Eye className="h-5 w-5" />
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {labLogo && (
            <img 
              src={labLogo} 
              alt={`${labName} Logo`} 
              className="h-12 w-12 object-contain rounded-lg"
            />
          )}
          <h2 className="text-xl font-semibold text-gray-800">
            {labName || 'Lab Invoices'}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="text-gray-500" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prescription ID
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {invoice.id || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {invoice.patientName || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {invoice.prescriptionId || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  ₹{typeof invoice.total === 'number' ? invoice.total.toFixed(2) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {renderStatus(invoice.status || 'unknown')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {renderActionButtons(invoice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No invoices found</p>
          </div>
        )}
      </div>
    </div>
  );
};
