import React, { useState, useEffect } from "react";
import { Text, View, Button } from "react-native";
import { Accelerometer, Gyroscope } from "expo-sensors";
import * as Location from "expo-location";

function App() {
  const [accelerometerData, setAccelerometerData] = useState({});
  const [gyroscopeData, setGyroscopeData] = useState({});
  const [locationData, setLocationData] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [isReading, setIsReading] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [sensorInterval, setSensorInterval] = useState(null);

  // Request location permissions on mount
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }
    })();
  }, []);

  const startSensorReadings = async () => {
    if (!isReading) {
      let currentAccelData = {};
      let currentGyroData = {};

      // Start accelerometer
      const accelSub = Accelerometer.addListener((accelerometer) => {
        currentAccelData = accelerometer;
        setAccelerometerData(accelerometer);
      });
      Accelerometer.setUpdateInterval(1000); 

      // Start gyroscope
      const gyroSub = Gyroscope.addListener((gyroscope) => {
        currentGyroData = gyroscope;
        setGyroscopeData(gyroscope);
      });
      Gyroscope.setUpdateInterval(1000);

      // Start continuous location tracking (update every second)
      const locationSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation, 
          timeInterval: 1000, 
          distanceInterval: 1, 
        },
        (location) => {
          console.log("New Location:", location.coords);
          setLocationData(location.coords);
          setLocationAccuracy(location.coords.accuracy);

          // Send data to the server every second
          sendDataToServer(currentAccelData, currentGyroData, location.coords);
        }
      );
      setLocationSubscription(locationSub);
      setIsReading(true);

      const interval = setInterval(() => {
        sendDataToServer(currentAccelData, currentGyroData, locationData);
      }, 1000);
      setSensorInterval(interval);
    }
  };

  const stopSensorReadings = () => {
    Accelerometer.removeAllListeners();
    Gyroscope.removeAllListeners();

    if (locationSubscription) {
      locationSubscription.remove(); 
      setLocationSubscription(null);
    }

    if (sensorInterval) {
      clearInterval(sensorInterval); 
      setSensorInterval(null);
    }

    setIsReading(false);
  };

  const sendDataToServer = async (accData, gyroData, locData) => {
    if (!locData) return; 
    const data = {
      timestamp: new Date().toISOString(),
      accelerometer: accData,
      gyroscope: gyroData,
      location: locData,
      accuracy: locationAccuracy, 
    };

    try {
      const response = await fetch("http://192.168.58.61:3000/sensordata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        console.error("Failed to send data");
      }
    } catch (error) {
      console.error("Error sending data to server:", error);
    }
  };

  const formatSensorData = (data) => {
    return `x: ${data.x?.toFixed(2)} y: ${data.y?.toFixed(2)} z: ${data.z?.toFixed(2)}`;
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontWeight: "bold", fontSize: 20 }}>Accelerometer:</Text>
      <Text style={{ paddingBottom: 10 }}>{formatSensorData(accelerometerData)}</Text>
      <Text style={{ fontWeight: "bold", fontSize: 20 }}>Gyroscope:</Text>
      <Text style={{ paddingBottom: 10 }}>{formatSensorData(gyroscopeData)}</Text>
      <Text style={{ fontWeight: "bold", fontSize: 20 }}>Location:</Text>
      <Text style={{ paddingBottom: 10 }}>
        {locationData
          ? `${locationData.latitude}, ${locationData.longitude} (Accuracy: ${locationAccuracy?.toFixed(2)} meters)`
          : "Fetching location..."}
      </Text>
      <View style={{ flexDirection: "row", padding: 10 }}>
        <Button onPress={startSensorReadings} title="Start" color="green" />
        <View style={{ paddingLeft: 10 }}>
          <Button onPress={stopSensorReadings} title="Stop" color="red" />
        </View>
      </View>
    </View>
  );
}

export default App;
