import React, { useState, useEffect } from "react";
import { Text, View, Button } from "react-native";
import { Accelerometer, Gyroscope } from "expo-sensors";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system"; // You can remove this import if no longer writing to the file

function App() {
  const [accelerometerData, setAccelerometerData] = useState({});
  const [gyroscopeData, setGyroscopeData] = useState({});
  const [locationData, setLocationData] = useState(null);
  const [isReading, setIsReading] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocationData(location.coords);
    })();
  }, []);

  const startSensorReadings = () => {
    if (!isReading) {
      let currentAccelData = {}; // Store real-time accelerometer data
      let currentGyroData = {};  // Store real-time gyroscope data
  
      const accelSub = Accelerometer.addListener((accelerometer) => {
        currentAccelData = accelerometer;  // Update real-time accelerometer data
        setAccelerometerData(accelerometer);  // Optionally update state if needed for UI
      });
      Accelerometer.setUpdateInterval(100);
  
      const gyroSub = Gyroscope.addListener((gyroscope) => {
        currentGyroData = gyroscope;  // Update real-time gyroscope data
        setGyroscopeData(gyroscope);  // Optionally update state if needed for UI
      });
      Gyroscope.setUpdateInterval(100);
  
      const id = setInterval(async () => {
        await sendDataToServer(currentAccelData, currentGyroData, locationData); // Use real-time data
      }, 1000);
  
      setIntervalId(id);
      setIsReading(true);
  
      return () => {
        accelSub && accelSub.remove();
        gyroSub && gyroSub.remove();
      };
    }
  };
  

  const stopSensorReadings = () => {
    Accelerometer.removeAllListeners();
    Gyroscope.removeAllListeners();
    clearInterval(intervalId);
    setIsReading(false);
  };

  const sendDataToServer = async (accData, gyroData, locData) => {
    console.log(accData)
    const data = {
      timestamp: new Date().toISOString(),
      accelerometer: accData,
      gyroscope: gyroData,
      location: locData,
    };
    console.log(data)

    try {
      const response = await fetch("http://13.127.154.51/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        //console.log("Data sent successfully:", data);
      } else {
        console.error("Failed to send data");
      }
    } catch (error) {
      console.error("Error sending data to server:", error);
    }
  };

  const formatSensorData = (data) => {
    return `x: ${data.x?.toFixed(2)} y: ${data.y?.toFixed(
      2
    )} z: ${data.z?.toFixed(2)}`;
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
          ? `${locationData.latitude}, ${locationData.longitude}`
          : "Fetching location..."}
      </Text>
      <View style={{ flexDirection: "row", padding: 10 }}>
        <Button
          onPress={startSensorReadings}
          title="Start"
          color="green"
          accessibilityLabel="Start sensor readings"
        />
        <View style={{ paddingLeft: 10 }}>
          <Button
            onPress={stopSensorReadings}
            title="Stop"
            color="red"
            accessibilityLabel="Stop sensor readings"
          />
        </View>
      </View>
    </View>
  );
}

export default App;

