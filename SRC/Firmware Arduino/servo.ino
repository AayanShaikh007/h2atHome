#include <ESP32Servo.h>

// --- Configuration ---
// Define the GPIO pin the servo signal (Yellow/Orange wire) is connected to.
// We'll use GPIO Pin 23 for this example.
const int servoPin = 23;

// Create a Servo object
Servo myservo;

// Define the sweep parameters
int pos = 0;    // Variable to store the servo position (0 to 180 degrees)
const int sweepDelay = 5; // Delay in milliseconds between steps (controls sweep speed)

void setup() {
  Serial.begin(115200);
  
  // Attach the servo object to the specified pin
  // The numbers 500 and 2400 define the pulse width limits (in microseconds)
  // for 0 and 180 degrees, respectively. These defaults work for most servos.
  myservo.attach(servoPin, 500, 2400);

  Serial.println("Servo setup complete. Starting sweep...");
}

void loop() {
  // Sweep from 0 degrees to 180 degrees
  // for (pos = 0; pos <= 180; pos += 1) {
  //   myservo.write(pos); // Tell servo to go to position in variable 'pos'
  //   delay(sweepDelay);
  // }

  // Sweep from 180 degrees to 0 degrees
  
  myservo.write(90); // Tell servo to go to position in variable 'pos'
  delay(3000);
  myservo.write(45); // Tell servo to go to position in variable 'pos'
  delay(3000);
  

  // Optional pause at the end of a full cycle
  // delay(1000); 
}


