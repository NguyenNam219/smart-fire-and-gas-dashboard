// [file name]: app.js
// [file content begin]
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

// Lưu trạng thái cũ - KHỞI TẠO VỚI null ĐỂ BIẾT LẦN ĐẦU
let previousState = {
    fire: null,
    gas: null,
    fan: null,
    pump: null,
    temperature: null,
    humidity: null,
    gasValue: null,
    highTempWarning: false,
    highTempDanger: false
};

// Cờ để biết đã nhận dữ liệu lần đầu chưa
let isFirstSensorData = true;
let isFirstActuatorData = true;

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

// === CẬP NHẬT TRẠNG THÁI NHIỆT ĐỘ TRÊN WEB ===
function updateTempStatus(temperature, highTempWarning, highTempDanger) {
    const tempStatus = document.getElementById('tempStatus');
    const tempStatusText = document.getElementById('tempStatusText');
    
    // Xóa các class cũ
    tempStatus.classList.remove('normal', 'warning', 'danger');
    
    if (highTempDanger) {
        tempStatus.className = 'card temp-status danger';
        tempStatusText.textContent = `🔥 Nhiệt độ ${temperature.toFixed(1)}°C - NGUY HIỂM! (>=60°C)`;
        // Thêm vào lịch sử
        addHistoryEvent('danger', `🌡️ NHIỆT ĐỘ NGUY HIỂM: ${temperature.toFixed(1)}°C (>=60°C)`, '🔥');
    } else if (highTempWarning) {
        tempStatus.className = 'card temp-status warning';
        tempStatusText.textContent = `⚠️ Nhiệt độ ${temperature.toFixed(1)}°C - Cảnh báo (50-60°C)`;
        // Thêm vào lịch sử (chỉ khi chưa có trong lịch sử gần đây)
        const lastEvent = historyLog[0];
        if (!lastEvent || !lastEvent.message.includes('Cảnh báo nhiệt độ')) {
            addHistoryEvent('warning', `🌡️ Cảnh báo nhiệt độ: ${temperature.toFixed(1)}°C (50-60°C)`, '⚠️');
        }
    } else {
        tempStatus.className = 'card temp-status normal';
        tempStatusText.textContent = `✅ Nhiệt độ ${temperature.toFixed(1)}°C - Bình thường (<50°C)`;
    }
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
        
        // Cập nhật trạng thái nhiệt độ trên web
        updateTempStatus(data.temperature, data.highTempWarning || false, data.highTempDanger || false);
        
        // === KIỂM TRA THAY ĐỔI ===
        // 1. Phát hiện lửa
        if (data.fire && !previousState.fire) {
            addHistoryEvent('danger', '🔥 PHÁT HIỆN LỬA!', '🚨');
        } else if (!data.fire && previousState.fire === true) {
            addHistoryEvent('info', '✅ Lửa đã được dập tắt', '✅');
        }
        
        // 2. Phát hiện gas
        if (data.gas && !previousState.gas) {
            addHistoryEvent('warning', '⚠️ PHÁT HIỆN KHÍ GAS!', '💨');
        } else if (!data.gas && previousState.gas === true) {
            addHistoryEvent('info', '✅ Khí gas đã trở lại an toàn', '✅');
        }
        
        // 3. Kiểm tra nhiệt độ cao (highTempWarning)
        if (data.highTempWarning && !previousState.highTempWarning) {
            addHistoryEvent('warning', `🌡️ CẢNH BÁO NHIỆT ĐỘ CAO: ${data.temperature}°C (50-60°C)`, '⚠️');
        } else if (!data.highTempWarning && previousState.highTempWarning) {
            addHistoryEvent('info', '✅ Nhiệt độ đã giảm xuống dưới 50°C', '✅');
        }
        
        // 4. Kiểm tra nhiệt độ nguy hiểm (highTempDanger)
        if (data.highTempDanger && !previousState.highTempDanger) {
            addHistoryEvent('danger', `🔥 NHIỆT ĐỘ NGUY HIỂM: ${data.temperature}°C (>=60°C) - KÍCH HOẠT CỨU HỎA!`, '🚨');
        } else if (!data.highTempDanger && previousState.highTempDanger) {
            addHistoryEvent('info', '✅ Nhiệt độ đã giảm xuống dưới 60°C', '✅');
        }
        
        // 5. Thay đổi nhiệt độ (> 0.5°C để tránh nhiễu)
        if (previousState.temperature !== null) {
            const tempDiff = Math.abs(data.temperature - previousState.temperature);
            if (tempDiff > 0.5) {
                addHistoryEvent('info', 
                    `🌡️ Nhiệt độ: ${previousState.temperature}°C → ${data.temperature}°C`, 
                    '🌡️'
                );
            }
        }
        
        // 6. Thay đổi humidity (> 5%)
        if (previousState.humidity !== null) {
            const humDiff = Math.abs(data.humidity - previousState.humidity);
            if (humDiff > 5) {
                addHistoryEvent('info', 
                    `💧 Độ ẩm: ${previousState.humidity}% → ${data.humidity}%`, 
                    '💧'
                );
            }
        }
        
        // 7. Thay đổi gas value đột ngột (> 100)
        if (previousState.gasValue !== null) {
            const gasDiff = Math.abs(data.gasValue - previousState.gasValue);
            if (gasDiff > 100) {
                addHistoryEvent('info', 
                    `🧪 Gas: ${previousState.gasValue} → ${data.gasValue}`, 
                    '🧪'
                );
            }
        }
        
        // Cập nhật trạng thái cũ
        previousState.fire = data.fire;
        previousState.gas = data.gas;
        previousState.temperature = data.temperature;
        previousState.humidity = data.humidity;
        previousState.gasValue = data.gasValue;
        previousState.highTempWarning = data.highTempWarning || false;
        previousState.highTempDanger = data.highTempDanger || false;
        
        isFirstSensorData = false;
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
        } else if (!data.fan && previousState.fan === true) {
            addHistoryEvent('info', '🌀 Quạt đã TẮT', '🌀');
        }
        
        if (data.pump && !previousState.pump) {
            addHistoryEvent('info', '💦 Bơm đã BẬT', '💦');
        } else if (!data.pump && previousState.pump === true) {
            addHistoryEvent('info', '💦 Bơm đã TẮT', '💦');
        }
        
        previousState.fan = data.fan;
        previousState.pump = data.pump;
        
        isFirstActuatorData = false;
    }
});

// === HIỂN THỊ LỊCH SỬ KHI TẢI TRANG ===
updateHistoryDisplay();

// === TỰ ĐỘNG LƯU LỊCH SỬ MỖI 5 PHÚT ===
setInterval(() => {
    saveHistory(historyLog);
}, 300000); // 5 phút
// [file content end]