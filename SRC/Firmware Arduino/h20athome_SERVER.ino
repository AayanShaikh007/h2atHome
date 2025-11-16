#include <WiFi.h>
#include <FirebaseESP32.h>

// --- FIREBASE AND WIFI CONFIG ---
// ⚠️ IMPORTANT: Replace these two lines with your actual Wi-Fi credentials
#define WIFI_SSID "Cat"
#define WIFI_PASSWORD "12345678"

// --- Service Account Credentials (Extracted from your JSON file) ---
#define FIREBASE_PROJECT_ID "gec-h2-at-home-2025"
#define FIREBASE_CLIENT_EMAIL "firebase-adminsdk-fbsvc@gec-h2-at-home-2025.iam.gserviceaccount.com"
#define FIREBASE_PRIVATE_KEY "<hidden>"
// --- FIREBASE PATH MATCHING DASHBOARD ---
// The path the ESP32 reads and writes status data to
const char* FIREBASE_STATUS_PATH = "artifacts/gec-h2-at-home-2025/users/esp32_prototype_device_1/h2_station_data/status"; 

// --- PIN DEFINITIONS ---
const int pumpPin = 22;// For the relay's 'IN' pin (Pump Control)
const int mq2Pin = 34;// ADC1 pin 34 for the Gas Sensor (SAFE FOR WIFI)
const int SAFETY_THRESHOLD = 650; 
const int PUMP_ON_DURATION = 3000; // 3 seconds for the auto cycle

// --- FIREBASE OBJECTS ---
FirebaseData fbdo;
FirebaseConfig config;
FirebaseAuth auth;

// --- CONTROL VARIABLE ---
int systemMode = 0; // 0=Auto-Schedule, 1=Manual Override (Turn Pump ON)

void setup() {
  Serial.begin(115200);
  Serial.println("H2@Home Firebase Client Starting...");

  // 1. HARDWARE SETUP
  pinMode(pumpPin, OUTPUT);
  digitalWrite(pumpPin, LOW); // Pump starts OFF

  // 2. WIFI SETUP
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi connected. IP: " + WiFi.localIP().toString());

  // 3. FIREBASE SETUP (Service Account)
  config.service_account.project_id = FIREBASE_PROJECT_ID;
  config.service_account.client_email = FIREBASE_CLIENT_EMAIL;
  config.service_account.private_key = FIREBASE_PRIVATE_KEY;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  if (Firebase.ready()) {
    int gasValue = analogRead(mq2Pin);
    
    // 1. READ CONTROL MODE FROM FIRESTORE
    // We only need the 'systemMode' field from the document
    if (Firebase.Firestore.getDocument(fbdo, FIREBASE_PROJECT_ID, "", FIREBASE_STATUS_PATH)) {
      if (fbdo.jsonString().length() > 0) {
        FirebaseJson json;
        json.setJsonData(fbdo.jsonString());
        
        // This line attempts to pull the integer value from the Firestore response
        if (json.get(systemMode, "fields/systemMode/integerValue")) {
          // Successfully updated systemMode from the web dashboard
        }
      }
    }

    Serial.printf("Gas Value: %d, Read Mode: %d\n", gasValue, systemMode);

    // 2. --- SAFETY CHECK (Always highest priority) ---
    if (gasValue > SAFETY_THRESHOLD) {
      Serial.println("!!! GAS LEAK DETECTED - SHUTTING DOWN !!!");
      digitalWrite(pumpPin, LOW);
      
      // Update Firebase: isGenerating=false, systemMode=1 (locked in manual mode)
      String payload = "{\"fields\":{\"isGenerating\":{\"booleanValue\":false},\"systemMode\":{\"integerValue\":1}}}";
      Firebase.Firestore.setDocument(fbdo, FIREBASE_PROJECT_ID, "", FIREBASE_STATUS_PATH, payload.c_str(), true);
      
      delay(5000); // Wait 5 seconds before checking again
    } 
    
    // 3. --- CONTROL MODE LOGIC ---
    else {
      // If the dashboard sets mode to MANUAL (1), turn the pump on continuously
      if (systemMode == 1) {
        Serial.println("STATUS: MANUAL OVERRIDE - PUMP ON");
        digitalWrite(pumpPin, HIGH);
        
        // Report status to dashboard: isGenerating=true
        String payload = "{\"fields\":{\"isGenerating\":{\"booleanValue\":true}}}";
        Firebase.Firestore.setDocument(fbdo, FIREBASE_PROJECT_ID, "", FIREBASE_STATUS_PATH, payload.c_str(), true);
        delay(1000); // Read/write every second while in manual mode

      } 
      // If the dashboard sets mode to AUTO (0), run the scheduled cycle
      else if (systemMode == 0) {
        Serial.println("STATUS: AUTO-SCHEDULE - Running 3s Cycle");
        
        // Pump ON (3s)
        digitalWrite(pumpPin, HIGH);
        String payload = "{\"fields\":{\"isGenerating\":{\"booleanValue\":true}}}";
        Firebase.Firestore.setDocument(fbdo, FIREBASE_PROJECT_ID, "", FIREBASE_STATUS_PATH, payload.c_str(), true);
        delay(PUMP_ON_DURATION);
        
        // Pump OFF (3s)
        digitalWrite(pumpPin, LOW);
        payload = "{\"fields\":{\"isGenerating\":{\"booleanValue\":false}}}";
        Firebase.Firestore.setDocument(fbdo, FIREBASE_PROJECT_ID, "", FIREBASE_STATUS_PATH, payload.c_str(), true);
        delay(PUMP_ON_DURATION);
      }
    }
  } else {
    // If Firebase isn't ready, don't run the logic, but keep trying.
    Serial.println("Firebase not ready. Check connection.");
    delay(1000);
  }
}
