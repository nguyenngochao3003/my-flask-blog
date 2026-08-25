// Hàm thêm một dòng mới vào bảng
function addProductRow(id, name, price, status) {
  // Tìm bảng sản phẩm dựa theo class .product
  const tableBody = document.querySelector('.product table tbody');
  
  if (!tableBody) {
    console.error('Không tìm thấy bảng sản phẩm!');
    return;
  }

  // Tạo một thẻ <tr> mới
  const newRow = document.createElement('tr');

  // Chèn nội dung các ô (<td>) vào dòng
  newRow.innerHTML = `
    <td>${id}</td>
    <td>${name}</td>
    <td>${price}</td>
    <td>${status}</td>
  `;

  // Thêm dòng mới vào cuối <tbody>
  tableBody.appendChild(newRow);
}

// Lắng nghe sự kiện click trên nút "Thêm sản phẩm"
document.getElementById('btnAddProduct').addEventListener('click', function() {
  // Ví dụ: lấy dữ liệu từ form hoặc dữ liệu mẫu
  const id = Date.now(); // Tạo ID ngẫu nhiên theo thời gian
  const name = 'Sản phẩm mới';
  const price = '200.000 VNĐ';
  const status = 'Còn hàng';

  // Gọi hàm thêm dòng
  addProductRow(id, name, price, status);
});