// --- PIN DEFINITIONS ---
const int SENSOR_PIN = 5;      // D5 for the Water Sensor
const int pumpPin = 22;        // Relay 1 (Pump 1 - Primary)
const int pumpin2r = 21;       // Relay 2 (Pump 2 - Secondary)

// --- TIMING VARIABLES (For non-blocking delays) ---
unsigned long pump1StopTime = 0;
const long PUMP2_START_DELAY = 5000;   // 5 seconds
const long PUMP2_RUN_DURATION = 60000; // 1 minute

// --- STATE VARIABLES ---
bool isPump2Running = false;
bool pump1WasOn = false;
bool pump1Disabled = false; // <-- NEW: Lock-out flag for Pump 1

// --- Debouncing / Anti-Chatter Variables ---
int lastRawWaterState = HIGH;      
int currentWaterState = HIGH; 
unsigned long lastDebounceTime = 0; 
const long DEBOUNCE_DELAY = 250;  

void setup() {
  Serial.begin(115200);
  Serial.println("💧 Water Level Control System Starting...");

  pinMode(SENSOR_PIN, INPUT);
  pinMode(pumpPin, OUTPUT);
  pinMode(pumpin2r, OUTPUT);

  digitalWrite(pumpPin, LOW);
  digitalWrite(pumpin2r, LOW);

  // Initialize the debouncer
  lastRawWaterState = digitalRead(SENSOR_PIN);
  currentWaterState = lastRawWaterState;
  Serial.print("Initial sensor state: ");
  Serial.println(currentWaterState == HIGH ? "WATER" : "NO WATER");
}

void loop() {
  unsigned long currentMillis = millis();

  // --- 1. Debounce the Water Sensor (Anti-Chatter Logic) ---
  int rawReading = digitalRead(SENSOR_PIN);

  if (rawReading != lastRawWaterState) {
    lastDebounceTime = currentMillis;
  }

  if ((currentMillis - lastDebounceTime) > DEBOUNCE_DELAY) {
    if (rawReading != currentWaterState) {
      currentWaterState = rawReading; 
      Serial.print("DEBOUNCER: New stable state: ");
      Serial.println(currentWaterState == HIGH ? "WATER" : "NO WATER");
    }
  }

  lastRawWaterState = rawReading;

  // --- 2. Control Pump 1 (pumpPin) - Primary Pump ---

  // "pumpin turns on when it detects no water" (Sensor LOW)
  // <-- MODIFIED: Added check for '!pump1Disabled'
  if (currentWaterState == LOW && !pump1Disabled) { 
    if (digitalRead(pumpPin) == LOW) { // If it's currently off
      Serial.println("WATER SENSOR: NO WATER (LOW) -> TURNING ON Pump 1 (pumpPin)");
      digitalWrite(pumpPin, HIGH);
    }
    pump1WasOn = true; 
    pump1StopTime = 0; 
  }
  // "when it does detect water the pumpin stops" (Sensor HIGH)
  // OR if Pump 1 is now disabled
  else { 
    
    if (digitalRead(pumpPin) == HIGH) { // If it's currently on
      // This will now trigger if water is detected OR if pump1Disabled is true
      Serial.println("WATER SENSOR: WATER DETECTED (HIGH) or DISABLED -> STOPPING Pump 1 (pumpPin)"); // <-- UPDATED TEXT
      digitalWrite(pumpPin, LOW);
        
      if (pump1WasOn) {
        pump1StopTime = currentMillis; 
        pump1WasOn = false; 
        Serial.println("Timer for Pump 2 started (5 seconds).");
      }
    }
  }

  // --- 3. Control Pump 2 (pumpin2r) - Secondary Pump ---

  // A. Start Check: 5 seconds after Pump 1 stops, start Pump 2
  if (pump1StopTime != 0 && !isPump2Running) {
    if (currentMillis - pump1StopTime >= PUMP2_START_DELAY) {
      Serial.println("5 seconds elapsed -> STARTING Pump 2 (pumpin2r) for 1 minute.");
      digitalWrite(pumpin2r, HIGH);
      isPump2Running = true;
      pump1StopTime = currentMillis; 
      
      // <-- NEW: Permanently disable Pump 1
      pump1Disabled = true;
      Serial.println("!!! Pump 1 is now permanently disabled. !!!");
    }
  }

  // B. Stop Check: Stop Pump 2 after 1 minute of running
  if (isPump2Running) {
    if (currentMillis - pump1StopTime >= PUMP2_RUN_DURATION) {
      Serial.println("1 minute elapsed -> STOPPING Pump 2 (pumpin2r).");
      digitalWrite(pumpin2r, LOW);
      isPump2Running = false;
      pump1StopTime = 0; 
    }
  }
  
  delay(50);
}