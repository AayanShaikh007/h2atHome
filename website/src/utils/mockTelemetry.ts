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

export function generateMockTelemetry(): TelemetryData {
  // Add realistic variation to simulate live data
  const baseTemp = 42 + (Math.random() - 0.5) * 4; // 40-44°C
  const baseVoltage = 12.4 + (Math.random() - 0.5) * 0.3; // 12.25-12.55V
  const baseCurrent = 3.1 + (Math.random() - 0.5) * 0.5; // 2.85-3.35A
  const basePower = baseVoltage * baseCurrent; // Realistic power calculation
  const baseHydrogenRate = 0.82 + (Math.random() - 0.5) * 0.1; // 0.77-0.87 L/min

  // Safety metrics
  let gasPpm = 350 + (Math.random() - 0.5) * 50; // Normal: 325-375 PPM

  // 0.5% chance of Minor Leak
  if (Math.random() < 0.005) {
    gasPpm = 800 + (Math.random() * 100); // 800-900 PPM
  }

  const pressureBar = 350 + (Math.random() - 0.5) * 10; // 345-355 bar

  const ventStatuses: ('Purging' | 'Standby' | 'Malfunction')[] = ['Standby', 'Standby', 'Standby', 'Purging'];
  const ventStatus = ventStatuses[Math.floor(Math.random() * ventStatuses.length)];

  return {
    temperature_c: Math.round(baseTemp * 100) / 100,
    voltage_v: Math.round(baseVoltage * 100) / 100,
    current_a: Math.round(baseCurrent * 1000) / 1000,
    power_w: Math.round(basePower * 100) / 100,
    hydrogen_rate: Math.round(baseHydrogenRate * 10000) / 10000,
    system_ok: Math.random() > 0.05, // 95% OK, 5% error for demo
    timestamp_ms: Date.now(),
    gas_ppm: Math.round(gasPpm),
    pressure_bar: Math.round(pressureBar),
    vent_status: ventStatus,
    is_system_active: true, // Default to true for mock
  };
}
