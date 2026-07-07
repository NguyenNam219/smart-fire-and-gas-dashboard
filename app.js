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

// Biến lưu dữ liệu cho chart
const tempData = [];
const tempLabels = [];
let tempChart = null;

// Đọc dữ liệu sensor
onValue(ref(db, "sensor"), (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
        document.getElementById("temp").innerText = "Temperature: " + data.temperature + " °C";
        document.getElementById("humidity").innerText = "Humidity: " + data.humidity + " %";
        document.getElementById("gas").innerText = "Gas Value: " + data.gasValue;
        document.getElementById("fire").innerText = "Fire: " + (data.fire ? "🔥 YES" : "✅ NO");
        
        // Cập nhật chart
        if (data.temperature !== undefined) {
            tempLabels.push(new Date().toLocaleTimeString());
            tempData.push(data.temperature);
            
            if (tempData.length > 20) {
                tempData.shift();
                tempLabels.shift();
            }
            
            if (tempChart) {
                tempChart.update();
            }
        }
    }
});

// Đọc trạng thái actuator
onValue(ref(db, "actuator"), (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
        // HIỂN THỊ TRẠNG THÁI FAN
        const fanStatus = data.fan ? "🟢 ON" : "🔴 OFF";
        document.getElementById("fan").innerText = "Fan: " + fanStatus;
        
        // HIỂN THỊ TRẠNG THÁI PUMP
        const pumpStatus = data.pump ? "🟢 ON" : "🔴 OFF";
        document.getElementById("pump").innerText = "Pump: " + pumpStatus;
        
        console.log("Fan:", data.fan, "Pump:", data.pump);
    }
});

// Khởi tạo Chart khi trang load
window.onload = function() {
    const ctx = document.getElementById('tempChart').getContext('2d');
    
    tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: tempLabels,
            datasets: [{
                label: 'Temperature (°C)',
                data: tempData,
                borderColor: 'red',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    }
                }
            }
        }
    });
};
