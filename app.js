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

// === QUẢN LÝ LỊCH SỬ VỚI localStorage ===
const STORAGE_KEY = 'fire_history_log';
const MAX_HISTORY = 100;

// Đọc lịch sử từ localStorage
function loadHistory() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

// Lưu lịch sử vào localStorage
function saveHistory(history) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
        console.error('Không thể lưu lịch sử:', e);
    }
}

// Khởi tạo lịch sử
let historyLog = loadHistory();

// Nếu lịch sử trống, thêm sự kiện khởi tạo
if (historyLog.length === 0) {
    historyLog.unshift({
        time: new Date().toLocaleTimeString(),
        type: 'info',
        message: '🚀 Hệ thống đã kết nối',
        icon: '✅',
        timestamp: Date.now()
    });
    saveHistory(historyLog);
}

// Lưu trạng thái cũ
let previousState = {
    fire: false,
    gas: false,
    fan: false,
    pump: false,
    temperature: 0,
    humidity: 0,
    gasValue: 0
};

// === HÀM THÊM SỰ KIỆN ===
function addHistoryEvent(type, message, icon) {
    const now = new Date();
    const event = {
        time: now.toLocaleTimeString(),
        type: type,
        message: message,
        icon: icon || '📌',
        timestamp: now.getTime()
    };
    
    historyLog.unshift(event);
    
    // Giới hạn số lượng
    if (historyLog.length > MAX_HISTORY) {
        historyLog.pop();
    }
    
    saveHistory(historyLog);
    updateHistoryDisplay();
}

// === HÀM CẬP NHẬT HIỂN THỊ LỊCH SỬ ===
function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    
    if (historyLog.length === 0) {
        historyList.innerHTML = '<div class="empty-history">⏳ Chưa có sự kiện nào</div>';
        return;
    }
    
    let html = '';
    historyLog.forEach(event => {
        const typeClass = event.type === 'danger' ? 'event-danger' : 
                         event.type === 'warning' ? 'event-warning' : 
                         'event-info';
        html += `
            <div class="history-item ${typeClass}">
                <span class="history-time">${event.time}</span>
                <span class="history-icon">${event.icon}</span>
                <span class="history-message">${event.message}</span>
            </div>
        `;
    });
    
    historyList.innerHTML = html;
}

// === XÓA LỊCH SỬ ===
document.getElementById('clearHistory').addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử?')) {
        historyLog = [];
        saveHistory(historyLog);
        updateHistoryDisplay();
        // Thêm lại sự kiện khởi tạo
        addHistoryEvent('info', '🗑️ Lịch sử đã được xóa', '🗑️');
        addHistoryEvent('info', '🚀 Hệ thống đang chạy', '✅');
    }
});

// === ĐỌC DỮ LIỆU SENSOR ===
onValue(ref(db, "sensor"), (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
        // Cập nhật thẻ hiển thị
        document.getElementById("temp").innerHTML = 
            "🌡️ Temperature: <strong>" + data.temperature + " °C</strong>";
        document.getElementById("humidity").innerHTML = 
            "💧 Humidity: <strong>" + data.humidity + " %</strong>";
        document.getElementById("gas").innerHTML = 
            "🧪 Gas Value: <strong>" + data.gasValue + "</strong>";
        
        const fireStatus = data.fire ? "🔥 YES - DANGER!" : "✅ NO - Safe";
        document.getElementById("fire").innerHTML = 
            "🔥 Fire: <strong>" + fireStatus + "</strong>";
        document.getElementById("fire").style.color = data.fire ? "#dc3545" : "#28a745";
        
        // === KIỂM TRA THAY ĐỔI ===
        // 1. Phát hiện lửa
        if (data.fire && !previousState.fire) {
            addHistoryEvent('danger', '🔥 PHÁT HIỆN LỬA!', '🚨');
        } else if (!data.fire && previousState.fire) {
            addHistoryEvent('info', '✅ Lửa đã được dập tắt', '✅');
        }
        
        // 2. Phát hiện gas
        if (data.gas && !previousState.gas) {
            addHistoryEvent('warning', '⚠️ PHÁT HIỆN KHÍ GAS!', '💨');
        } else if (!data.gas && previousState.gas) {
            addHistoryEvent('info', '✅ Khí gas đã trở lại an toàn', '✅');
        }
        
        // 3. Thay đổi nhiệt độ (> 1.5°C)
        if (Math.abs(data.temperature - previousState.temperature) > 1.5) {
            addHistoryEvent('info', 
                `🌡️ Nhiệt độ: ${previousState.temperature}°C → ${data.temperature}°C`, 
                '🌡️'
            );
        }
        
        // 4. Thay đổi gas value đột ngột (> 200)
        if (Math.abs(data.gasValue - previousState.gasValue) > 200) {
            addHistoryEvent('info', 
                `🧪 Gas: ${previousState.gasValue} → ${data.gasValue}`, 
                '🧪'
            );
        }
        
        // Cập nhật trạng thái cũ
        previousState.fire = data.fire;
        previousState.gas = data.gas;
        previousState.temperature = data.temperature;
        previousState.humidity = data.humidity;
        previousState.gasValue = data.gasValue;
    }
});

// === ĐỌC TRẠNG THÁI ACTUATOR ===
onValue(ref(db, "actuator"), (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
        // Cập nhật hiển thị FAN
        const fanStatus = data.fan ? "🟢 ON" : "🔴 OFF";
        document.getElementById("fan").innerHTML = 
            "🌀 Fan: <strong>" + fanStatus + "</strong>";
        document.getElementById("fan").style.color = data.fan ? "#28a745" : "#dc3545";
        
        // Cập nhật hiển thị PUMP
        const pumpStatus = data.pump ? "🟢 ON" : "🔴 OFF";
        document.getElementById("pump").innerHTML = 
            "💦 Pump: <strong>" + pumpStatus + "</strong>";
        document.getElementById("pump").style.color = data.pump ? "#28a745" : "#dc3545";
        
        // === KIỂM TRA THAY ĐỔI ===
        if (data.fan && !previousState.fan) {
            addHistoryEvent('info', '🌀 Quạt đã BẬT', '🌀');
        } else if (!data.fan && previousState.fan) {
            addHistoryEvent('info', '🌀 Quạt đã TẮT', '🌀');
        }
        
        if (data.pump && !previousState.pump) {
            addHistoryEvent('info', '💦 Bơm đã BẬT', '💦');
        } else if (!data.pump && previousState.pump) {
            addHistoryEvent('info', '💦 Bơm đã TẮT', '💦');
        }
        
        previousState.fan = data.fan;
        previousState.pump = data.pump;
    }
});

// === HIỂN THỊ LỊCH SỬ KHI TẢI TRANG ===
updateHistoryDisplay();

// === TỰ ĐỘNG LƯU LỊCH SỬ MỖI 5 PHÚT ===
setInterval(() => {
    saveHistory(historyLog);
}, 300000); // 5 phút