import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue
}
from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

//Firebase Config
const firebaseConfig = {

    apiKey: "AIzaSyCO5Vgn03U6NlaI1bLnsgIsFZoobU1CjpY",

    authDomain:
    "smart-fire-and-gas-detec-59a96.firebaseapp.com",

    databaseURL:
    "https://smart-fire-and-gas-detec-59a96-default-rtdb.asia-southeast1.firebasedatabase.app",

    projectId:
    "smart-fire-and-gas-detec-59a96",

};

//Khởi tạo
const app =
initializeApp(firebaseConfig);

const db =
getDatabase(app);

//Đọc dữ liệu Realtime
onValue(
    ref(db,"sensor"),
    (snapshot)=>
    {
        const data =
        snapshot.val();

        document.getElementById("temp")
        .innerText =
        "Temperature: "
        + data.temperature
        + " °C";

        document.getElementById("humidity")
        .innerText =
        "Humidity: "
        + data.humidity
        + " %";

        document.getElementById("gas")
        .innerText =
        "Gas Value: "
        + data.gasValue;

        document.getElementById("fire")
        .innerText =
        "Fire: "
        + (data.fire ? "YES" : "NO");
    }
);

//Đọc trạng thái Relay
onValue(
    ref(db,"actuator"),
    (snapshot)=>
    {
        const data =
        snapshot.val();

        document.getElementById("fan")
        .innerText =
        "Fan: "
        + (data.fan ? "ON" : "OFF");

        document.getElementById("pump")
        .innerText =
        "Pump: "
        + (data.pump ? "ON" : "OFF");
    }
);

//Biểu đồ nhiệt độ
const tempData = [];
const tempLabels = [];


//Khởi tạo Chart

const ctx =
document.getElementById('tempChart');

const tempChart =
new Chart(ctx, {

    type:'line',

    data:{
        labels:tempLabels,

        datasets:[
        {
            label:'Temperature',

            data:tempData
        }]
    }
});

//Mỗi lần Firebase cập nhật

tempLabels.push(
    new Date()
    .toLocaleTimeString()
);

tempData.push(
    data.temperature
);

//Giới hạn 20 điểm:

if(tempData.length > 20)
{
    tempData.shift();
    tempLabels.shift();
}

//Update chart

tempChart.update();