var google_apps_script_url = "https://script.google.com/macros/s/AKfycbzrH6JSUoTUbs5kCdvhf_AORfS_yWTl0BVXA7Wy_gQD8jmyt35qDpM_lQfpUhUuwGaeaQ/exec";

$(document).ready(function () {
    $("#fetchDataBtn").click(function (event) {
        event.preventDefault();  // 防止表單提交，僅當你有表單的情況下需要
        fetchGoogleAppsScriptData();
    });

    $("#startDataBtn").click(function (event) {
        event.preventDefault();  // 防止表單提交，僅當你有表單的情況下需要
        RoOpenMarketPriceInquiry();
    });
});

function fetchGoogleAppsScriptData() {
    var DataArray = [1];  // 用一維陣列代替

    $.ajax({
        url: google_apps_script_url,
        type: 'POST',
        dataType: 'text',
        data: JSON.stringify({ DataArray: DataArray }),
        contentType: 'text/plain; charset=utf-8',
        success: function (data) {
            displayData(JSON.parse(data));
        },
        error: function () {
            alert('Request Failed'); // 处理错误情况
        }
    });
}

function displayData(data) {
    const $dataTextArea = $("#dataTextArea");
    $dataTextArea.val("");  // 清空文字區域

    const formattedData = data.map(item => item[0]).join("\n");
    $dataTextArea.val(formattedData);  // 將資料顯示在多行文字區域
}

var n1;

function RoOpenMarketPriceInquiry() {
    DataObject = getDataArrayFromTextArea();
    $.ajax({
        url: "/DataQuery",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(DataObject),
        // data: formData, // 如果要发送 FormData，可以直接传递
        success: function (data) {
            // console.log(data);
            updateTable(data); // 調用更新表格的函式
        },
        error: function (error) {
            console.error("Error:", error);
        }
    });
};

//查詢資料轉一維陣列
function getDataArrayFromTextArea() {
    const $dataTextArea = $("#dataTextArea");
    const textAreaContent = $dataTextArea.val();
    const dataArray = textAreaContent.split("\n");  // 將每行轉換為陣列中的一個元素
    return dataArray;
}

function updateTable(data) {
    // 清空表格
    const $dataTableBody = $('#dataTable tbody');
    $dataTableBody.empty();

    let flatDataArray = [2];

    // 解析並插入新資料
    data.forEach(item => {
        const keyword = item.keyword;
        const rowsData = item.data;

        rowsData.forEach(row => {
            const $newRow = $('<tr></tr>');

            // 插入關鍵字列
            const $keywordCell = $('<td></td>').text(keyword);
            $newRow.append($keywordCell);

            // 插入其他資料列
            row.forEach(cellData => {
                const $cell = $('<td></td>').text(cellData);
                $newRow.append($cell);

                // 將資料添加到一維陣列中
                flatDataArray.push(cellData);
            });

            $dataTableBody.append($newRow);

        });
    });

    $.ajax({
        url: google_apps_script_url,
        type: 'POST',
        dataType: 'text',
        data: JSON.stringify({ DataArray: flatDataArray }),
        contentType: 'text/plain; charset=utf-8',
        success: function (data) {
            alert('完成')
        },
        error: function () {
            alert('Request Failed'); // 处理错误情况
        }
    });
}