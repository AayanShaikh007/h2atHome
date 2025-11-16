#include <WiFi.h>
#include <FirebaseESP32.h>

// --- FIREBASE AND WIFI CONFIG ---
// ⚠️ IMPORTANT: Replace these two lines with your actual Wi-Fi credentials
#define WIFI_SSID "Cat"
#define WIFI_PASSWORD "12345678"

// --- Service Account Credentials (Extracted from your JSON file) ---
#define FIREBASE_PROJECT_ID "gec-h2-at-home-2025"
#define FIREBASE_CLIENT_EMAIL "firebase-adminsdk-fbsvc@gec-h2-at-home-2025.iam.gserviceaccount.com"
#define FIREBASE_PRIVATE_KEY "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCZ7zcO7xbXCKye\nH76ttk/htDIwIS0F9iaztLPIu7mPZjFckmXQ6sFLl9HzAv6c8jnVxZjQeiUVepWF\n58ET9TLodbFNE//1Bix3FwXAnOMFOPMZsDnsY7dHHZxA6GBWadWakKPsjD6rb0oF\noAwcTUCij85d9jgQw3vimuX994gH7UaG/Sm8FsnZcY63iuLtXNQD1UNvG3/BT0bE\nZqOolEvWalOQoJdjYnELi2RwH+EuKE25IqJ65ykWFZPBj9txmwX6O26g2MI0HjXs\nupJoqJd+hwe4YxhyTNW5UydfNm703IceD+NTLOEPz1rs2KpuTVjMhRRYrwjLwzjh\nfumNXG3TAgMBAAECggEAG0tfy12YgqtulCET2dBkTKR7a65OQeraBO5LHJIwvl0D\n7qKkvA0MFh/G4dyLkf+fQqjlRj4KOktAnPwxb50AGFjaBc1Ais078CfcZMFMvb3R\n2SG2u5QYyNrWvGmXv2rHrb7s2gIqEJLMoL+2tgP6rHhsQpvoaAyJeG43zrbn32Os\nAONli2CkWh+Pp9s1gaqyXGu68OHkaTlprrdZ5FOOrlSYz9BktmprpFz9wqE4LWLR\nkpsbrsT2qppSV5RdPJ2bDLZQQrpk41XrVX8Qg4FJCi2rdhhAP3UtAWWJQEewl3BI\nQbXBU3GbNNnVcWKGs8yMDW1ESZAt4YrRR57z1olIRQKBgQDYJ8gaZDR15xd2QCTE\nwDZ8c+1AnkHA6J3xSgyFM1dIpvS3dXyJL87KLcZ9BwOAERZCGHeGItRU+gULBizm\nXDZ+w128Sss/CfCE5oKtWASDoESKjx1xpzZRwEyli5gjxXhN7sXiJE3PknD8XYln\ncOA/gg9Ia9YLh6RSll7gaOiITwKBgQC2T0VO/je+i07xNfCL7sc83sLC4dbi2htE\nciUlN58XCXOUc9nsf+4P0nb99KZH1O7ojrW+r6DyGiBPDz1EnMgfUE19FrDlQmpv\ngkK7vDF3IuaTl82XYPLtQ4IPL7dYPC7GMvqV50lIZoibAWG+Ml6u89S9xk6K9VkS\n5QWW7Y0dPQKBgGeH9mIdqLroKuaqpnHOlspZREP1CQ163Vua2hBanO3hecj9bt7O\nlT9lWXK9D0Ih7QVPbsBComzpK80x8gOMG1XwAU+Ui3DwM9GUDvcz90WMWAf9sF6l\ndnEFqDCKgh5wEMVTHljIhrRrMc7OhmeTOvVwOB25+NWg7GXaPCtEVEwlAoGBAKoI\nnRfjupIY0/Pc3xFkDqcTDIs+n3DNA4l+/G4Nxm9x/T6EHsiZOKvBHAIX3843Juv3\nzkKfA3lKLMAP8pC/uVabSupT84CfxS1jTGJUT75R6sPVXYbGgUwRHoiTdGjzGJz6\nhwSwxoSkPNx1GXiO+ggqmky1XCP2WLFqsR/nRynxAoGAZmSNBJAO5MEg6NZGMCMG\n9UEwIcjpFRetRPUIgOpBcYfH+JllQmJX80KtEyiMgyK2iXZRRebN/Ye07IMMR2IZ\nY34Hh0F6t38HTs6u5s7tNmWgvS6Og2GHslmYCPrgS1sNb+x4sVYrMKC5YVuLNBX8\n8NIqN1PM5bJyA1YSRPHgwFw=\n-----END PRIVATE KEY-----\n"

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