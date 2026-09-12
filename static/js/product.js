// Import Supabase Client ở đầu file
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ========================================================
// 1. CÁC HÀM XỬ LÝ UI / SIDEBAR / MODAL / QR SCANNER
// ========================================================
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
  document.getElementById('sidebarOverlay').classList.toggle('active');
}

function openQRScanner() {
  window.open(
    "https://nguyenngochao3003.github.io/qr-scanner/",
    "_blank"
  );
}

// Bắt sự kiện nhận dữ liệu QR Scanner
window.addEventListener("message", function(event) {
  if (event.origin !== "https://nguyenngochao3003.github.io") return;
  if (!event.data || event.data.type !== "QR_SCANNED") return;

  const qrCode = event.data.code;
  console.log("Đã nhận QR:", qrCode);

  const inputEl = document.getElementById("productForm_productCode");
  if (inputEl) inputEl.value = qrCode;
});

function openModal(id) {
  const element = document.getElementById(id);
  if (element) element.classList.add('active');
}

function closeModal(id) {
  const element = document.getElementById(id);
  if (element) element.classList.remove('active');
}

window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
  }
};

// Gán các hàm vào window để có thể call trực tiếp từ HTML (onclick="openModal(...)")
window.toggleSidebar = toggleSidebar;
window.openQRScanner = openQRScanner;
window.openModal = openModal;
window.closeModal = closeModal;


// ========================================================
// 2. CÁC HÀM XỬ LÝ SUPABASE & DỮ LIỆU PRODUCT
// ========================================================
let userSupabase;
let refreshTokenValue;

async function initSupabase() {
  console.log("initSupabase đã được gọi");

  try {
    const res = await fetch('/api/get_token');
    const data = await res.json();

    if (!res.ok || !data.access_token) {
      console.error("Không lấy được token xác thực:", data.error || "Token rỗng");
      alert("Phiên đăng nhập hết hạn hoặc chưa có Token. Vui lòng đăng nhập lại!");
      return;
    }

    userSupabase = createClient(data.url, data.key, {
      global: {
        headers: { Authorization: `Bearer ${data.access_token}` }
      }
    });

    if (!userSupabase) {
      console.error("Supabase client chưa khởi tạo");
      return;
    }

    refreshTokenValue = data.refresh_token;

    await get_product_data();
    subscribeRealtime();
  } catch (err) {
    console.error("Lỗi khởi tạo Supabase:", err);
  }
}

async function handleSessionExpired() {
  alert('Phiên đăng nhập của bạn đã hết hạn hoặc tài khoản vừa được đăng nhập ở nơi khác. Bấm OK để đăng nhập lại.');
 
  localStorage.clear();
  sessionStorage.clear();

  try {
    await fetch('/logout', { method: 'POST' });
  } catch (err) {
    console.error("Lỗi khi xóa session flask:", err);
  }

  window.location.href = '/login';
}

function checkTokenError(error) {
  if (!error) return false;

  const isAuthError = error.status === 401 || 
                      error.code === 'PGRST301' || 
                      (error.message && error.message.includes('JWT'));

  if (isAuthError) {
    handleSessionExpired();
    return true;
  }
  return false;
}

async function get_product_data() {
  // 1. Dữ liệu profiles
  try {
    const { data: { user }, error } = await userSupabase.auth.getUser();

    if (error) {
      if (checkTokenError(error)) return;
      console.error("Lỗi khác:", error.message);
      return;
    }

    const { data: profile, error: p_error } = await userSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (p_error) throw p_error;

    document.getElementById('userName').innerHTML = `<p>${profile.user_name}</p>`;
    document.getElementById('role').innerHTML = `<p>${profile.role}</p>`;

  } catch (p_error) {
    console.log('p_error at func get_product_data: ', p_error);
  }

  // 2. Bảng products
  try {
    const { data: product, error: prod_error } = await userSupabase
      .from('view_product_details')
      .select('*');

    if (prod_error) {
      if (checkTokenError(prod_error)) return;
      throw prod_error;
    }
   
    render_product_table(product);
   
  } catch (prod_error) {
    console.log('prod_error at func get_product_data: ', prod_error);
  }

  // 3. Select category
  try {
    const { data: category, error: category_error } = await userSupabase
      .from('category')
      .select('*');

    if (category_error) {
      if (checkTokenError(category_error)) return;
      throw category_error;
    }
    console.log('data category', category);
    render_select(category, 'categorySelect');
   
  } catch (category_error) {
    console.log('category_error at func render_select: ', category_error);
  }

  // 4. Select supplier
  try {
    const { data: supplier, error: supplier_error } = await userSupabase
      .from('supplier')
      .select('*');

    if (supplier_error) {
      if (checkTokenError(supplier_error)) return;
      throw supplier_error;
    }
    console.log('data supplier', supplier);
    render_select(supplier, 'supplierSelect');
   
  } catch (supplier_error) {
    console.log('supplier_error at func render_select: ', supplier_error);
  }
}

function render_product_table(data) {
  let htmlTableContent = '';
  let htmlCardContent = '';

  for (const p of data) {
    htmlTableContent += `<tr data-id="${p.id}">
      <td><img src="/static/images/image.png" alt="SP" class="product-img"></td>
      <td><span class="code-badge">${p.code}</span></td>
      <td><strong>${p.product_name}</strong></td>
      <td>${p.supplier_name}</td>
      <td>${p.product_group}</td>
      <td>${p.employee_name}</td>
      <td>${p.created_at}</td>
      <td>
          <button class="action-btn delete-btn" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>`;

    // ĐÃ SỬA: Thay {{ url_for(...) }} bằng đường dẫn tĩnh /static/images/image.png
    htmlCardContent += `<div class="product-item" data-id=${p.id}>
      <img src="/static/images/image.png" alt="Áo Sơ mi Nam" class="product-img">
      <div class="product-info">
        <h3 class="product-title">${p.product_name}</h3>
        <div class="product-details">
            <span class="label">${p.product_group}</span>
            <span class="value">${p.employee_name}</span>
            <span class="label">${p.code} code</span>
            <span class="value">${p.created_at}</span>
            <button class="action-btn delete-btn" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
    </div>`;
  }

  document.querySelector(`#product_table tbody`).innerHTML = htmlTableContent;
  document.querySelector(`#product_card`).innerHTML = htmlCardContent;
}

function render_select(option_data, id) {
  console.log('render_selection func');
  let htmlContent = '';
  for (const c of option_data) {
    console.log('id', c.id);
    htmlContent += `<option value="${c.id}">${c.name}</option>`; 
  }
  document.querySelector(`#${id}`).innerHTML = htmlContent;
}

  // lấy id khi bấm nút xóa
  document.querySelector('#wrapper').addEventListener('click', async function(e) {
  if (e.target.closest('.delete-btn')) {
    console.log('func remove_product');

    let row = null;

    if (e.target.closest('tr')) {
      row = e.target.closest('tr');
    } else if (e.target.closest('.product-item')) {
      row = e.target.closest('.product-item');
    } else { alert('không tìm thấy dòng nào để xóa')}
    
    const id = row.dataset.id;
    console.log(`xóa dòng ${id} trong bảng product`);

    const { error } = await userSupabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('lỗi khi xóa supabase', error);
      alert('Không thể xóa dữ liệu!');
    } else {
      row.remove();
      alert('đã xóa thành công');
    }
  }
});

window.submit_addProduct = submit_addProduct;
async function submit_addProduct() {

  const prod_name = document.getElementById("productForm_name").value;
  const code = document.getElementById("productForm_code").value;
  const id_category = document.getElementById("categorySelect").value;
  const id_supplier = document.getElementById("supplierSelect").value;

  try {
    // lấy user
      const { data: { user }, error } = await userSupabase.auth.getUser();
      if (error) {
        if (checkTokenError(error)) return;
        console.error("Lỗi khác:", error.message);
        return;
      }
      // lấy bảng nhân viên
      const { data: employee, error: e_err } = await userSupabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (e_err) throw e_err;

      // chèn vào bảng product
      const { data, error: insertError } = await userSupabase
        .from('products')
        .insert([{
          name: prod_name,
          code_nsx: code,
          id_supplier,
          id_category,
          id_employee: employee.id
        }]);

      // kiểm tra lỗi >> không lỗi gọi lại trang product
      if (insertError) {
        console.error("Insert error:", insertError);
      } else {
        console.log("Insert success:", data);
        window.location.href = "/product";
      }
    } catch (err ){
      console.log('1. lỗi tại nút btnAddProduct: ', err.message);
    }

}


function subscribeRealtime() {
  const channel = userSupabase.channel("messages_channel")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, payload => {
      console.log("Realtime update:", payload);
      console.log("Realtime update:", payload);
      get_product_data(); // gọi lại để load view
    })
    .subscribe((status) => {
      console.log("Channel status:", status);
      if (status === "SUBSCRIBED") {
        console.log("Đã subscribe realtime thành công!");
      }
    });

  channel.on("error", async (err) => {
    console.error("Realtime error:", err);

    const res = await fetch("/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshTokenValue })
    });
    const data = await res.json();
    refreshTokenValue = data.refresh_token;

    userSupabase = createClient(data.url, data.key, {
      global: { headers: { Authorization: `Bearer ${data.access_token}` } }
    });

    subscribeRealtime();
  });
}

// Khởi tạo khi DOM đã load xong
document.addEventListener("DOMContentLoaded", () => {
  initSupabase();
});