import React from 'react';
import { useTelemetry } from '../hooks/useTelemetry';

interface TelemetryDashboardProps {
  apiUrl: string;
  useMockData?: boolean;
}

const formatTimestamp = (ms: number): string => {
  return new Date(ms).toLocaleString();
};

const TelemetryCard: React.FC<{ label: string; value: string | number; unit?: string; status?: boolean }> = ({
  label,
  value,
  unit,
  status,
}) => {
  const bgColor = status === false ? 'bg-red-50' : 'bg-white';
  const borderColor = status === false ? 'border-red-200' : 'border-gray-200';
  const textColor = status === false ? 'text-red-900' : 'text-gray-900';

  return (
    <div className={`${bgColor} rounded-lg border ${borderColor} p-4 shadow-sm`}>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${textColor}`}>
        {value}
        {unit && <span className="text-lg ml-1">{unit}</span>}
      </p>
    </div>
  );
};

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({ apiUrl, useMockData = false }) => {
  const { data, loading, error, refetch } = useTelemetry(apiUrl, 1500, useMockData);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading telemetry data...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h3 className="text-lg font-semibold text-red-900">Error Loading Telemetry</h3>
        <p className="mt-2 text-red-800">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <p className="text-yellow-900">No telemetry data available</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">⚠ {error} - Showing last known data</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <TelemetryCard
          label="Temperature"
          value={data.temperature_c.toFixed(2)}
          unit="°C"
        />
        <TelemetryCard
          label="Voltage"
          value={data.voltage_v.toFixed(2)}
          unit="V"
        />
        <TelemetryCard
          label="Current"
          value={data.current_a.toFixed(3)}
          unit="A"
        />
        <TelemetryCard
          label="Power"
          value={data.power_w.toFixed(2)}
          unit="W"
        />
        <TelemetryCard
          label="Hydrogen Rate"
          value={data.hydrogen_rate.toFixed(4)}
          unit="L/min"
        />
        <TelemetryCard
          label="System Status"
          value={data.system_ok ? '✓ OK' : '✗ ERROR'}
          status={data.system_ok}
        />
      </div>

      <div className="mt-6 flex items-center justify-between rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          Last updated: <span className="font-mono font-semibold">{formatTimestamp(data.timestamp_ms)}</span>
        </p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
        >
          Refresh Now
        </button>
      </div>
    </div>
  );
};
