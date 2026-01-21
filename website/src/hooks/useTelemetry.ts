import { useState, useEffect, useCallback } from 'react';
import { generateMockTelemetry } from '../utils/mockTelemetry';

interface TelemetryData {
  temperature_c: number;
  voltage_v: number;
  current_a: number;
  power_w: number;
  hydrogen_rate: number;
  system_ok: boolean;
  timestamp_ms: number;
  gas_ppm: number;
  pressure_bar: number;
  vent_status: 'Purging' | 'Standby' | 'Malfunction';
  is_system_active: boolean;
}

interface UseTelemetryReturn {
  data: TelemetryData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTelemetry(apiUrl: string, refreshInterval: number = 10000, useMockData: boolean = false): UseTelemetryReturn {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTelemetry = useCallback(async () => {
    try {
      setError(null);

      if (useMockData) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        setData(generateMockTelemetry());
      } else {
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const jsonData = await response.json();
        setData(jsonData);
      }

      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch telemetry';
      setError(errorMessage);
      setLoading(false);
    }
  }, [apiUrl, useMockData]);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchTelemetry, refreshInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchTelemetry,
  };
}
