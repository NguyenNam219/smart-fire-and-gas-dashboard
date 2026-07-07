import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
    getDatabase,
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCO5Vgn03U6NlaI1bLnsgIsFZoobU1CjpY",
    authDomain: "smart-fire-and-gas-detec-59a96.firebaseapp.com",
    databaseURL: "https://smart-fire-and-gas-detec-59a96-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "smart-fire-and-gas-detec-59a96",
};

// Khởi tạo
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Đọc dữ liệu sensor
onValue(ref(db, "sensor"), (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
        document.getElementById("temp").innerHTML = 
            "🌡️ Temperature: <strong>" + data.temperature + " °C</strong>";
        document.getElementById("humidity").innerHTML = 
            "💧 Humidity: <strong>" + data.humidity + " %</strong>";
        document.getElementById("gas").innerHTML = 
            "🧪 Gas Value: <strong>" + data.gasValue + "</strong>";
        
        // Hiển thị trạng thái Fire với icon
        const fireStatus = data.fire ? "🔥 YES - DANGER!" : "✅ NO - Safe";
        document.getElementById("fire").innerHTML = 
            "🔥 Fire: <strong>" + fireStatus + "</strong>";
        document.getElementById("fire").style.color = data.fire ? "red" : "green";
        
        console.log("Sensor data:", data);
    }
});

// Đọc trạng thái actuator
onValue(ref(db, "actuator"), (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
        // HIỂN THỊ TRẠNG THÁI FAN
        const fanStatus = data.fan ? "🟢 ON" : "🔴 OFF";
        document.getElementById("fan").innerHTML = 
            "🌀 Fan: <strong>" + fanStatus + "</strong>";
        document.getElementById("fan").style.color = data.fan ? "green" : "red";
        
        // HIỂN THỊ TRẠNG THÁI PUMP
        const pumpStatus = data.pump ? "🟢 ON" : "🔴 OFF";
        document.getElementById("pump").innerHTML = 
            "💦 Pump: <strong>" + pumpStatus + "</strong>";
        document.getElementById("pump").style.color = data.pump ? "green" : "red";
        
        console.log("Fan:", data.fan, "Pump:", data.pump);
    }
});
