
let qrScannerWindow = null;


// ========================================
// MỞ QR SCANNER
// ========================================

function openQRScanner() {

  qrScannerWindow = window.open(
    "https://nguyenngochao3003.github.io/qr-scanner/",
    "_blank"
  );

}


// ========================================
// NHẬN DỮ LIỆU TỪ QR SCANNER
// ========================================
function setupQRListener(inputId) {
  window.addEventListener("message", function(event) {
    // Kiểm tra nguồn gửi
    if (event.origin !== "https://nguyenngochao3003.github.io") {
      return;
    }

    // Kiểm tra dữ liệu
    if (!event.data) {
      return;
    }

    if (event.data.type !== "QR_SCANNED") {
      return;
    }

    // Lấy mã QR
    const qrCode = event.data.code;
    console.log("Đã nhận QR:", qrCode);

    const data = event.data;

    // Đưa mã QR vào input theo id truyền vào
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
      inputElement.value = qrCode;
    }

    // // Hiển thị thông tin chi tiết
    // const time = new Date(data.timestamp);
    // const detailElement = document.getElementById(detailId);
    // if (detailElement) {
    //   detailElement.textContent =
    //     "Scanner: " + data.scanner +
    //     " | Timestamp: " + time.toLocaleString("vi-VN") +
    //     " | Location: " + data.location;
    // }
  });
}
 // ========================================
// TẠO QR SCANNER
// ========================================
function createQRCode() {

  const productCode =
    document.getElementById("productCode").value.trim();

  if (!productCode) {
    alert("Vui lòng nhập mã sản phẩm");
    return;
  }

  const qrContainer =
    document.getElementById("qrcode");

  // Xóa QR cũ
  qrContainer.innerHTML = "";

  // QR chỉ chứa mã sản phẩm
  new QRCode(
    qrContainer,
    {
      text: productCode,
      width: 200,
      height: 200
    }
  );
}

function printQRCode() {

  const qrElement =
    document.getElementById("qrcode");

  const productCode =
    document.getElementById("productCode").value.trim();

  if (!qrElement.innerHTML) {
    alert("Vui lòng tạo mã QR trước");
    return;
  }

  const printWindow = window.open("", "_blank");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>

      <title>In mã QR - ${productCode}</title>

      <style>

        body {
          font-family: Arial, sans-serif;
          text-align: center;
          margin: 0;
          padding: 20px;
        }

        .label {
          width: 50mm;
          min-height: 50mm;
          margin: auto;
          text-align: center;
        }

        .label h3 {
          margin: 5px 0;
          font-size: 16px;
        }

        .label p {
          margin: 5px 0;
          font-size: 12px;
        }

        #printQR img {
          width: 40mm;
          height: 40mm;
        }

        @media print {

          @page {
            margin: 5mm;
          }

          body {
            padding: 0;
          }

        }

      </style>

    </head>

    <body>

      <div class="label">

        <h3>MÃ SẢN PHẨM</h3>

        <div id="printQR"></div>

        <p>${productCode}</p>

      </div>

      <script>

        const source =
          window.opener.document.getElementById("qrcode");

        const target =
          document.getElementById("printQR");

        target.innerHTML = source.innerHTML;

        setTimeout(() => {
          window.print();
        }, 500);

      <\/script>

    </body>
    </html>
  `);

  printWindow.document.close();
}