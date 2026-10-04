// Import Supabase Client ở đầu file
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Khởi tạo khi DOM đã load xong
document.addEventListener("DOMContentLoaded", () => {
  initSupabase();
});

// ========================================================
// 1. khởi tạo supabase để lấy dữ liệu
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
    window.userSupabase = userSupabase;

    if (!userSupabase) {
      console.error("Supabase client chưa khởi tạo");
      return;
    }

    refreshTokenValue = data.refresh_token;

    await get_profiles_data();

    // đăng ký real time cho một bảng nào đó 

  } catch (err) {
    console.error("Lỗi khởi tạo Supabase:", err);
  }
}


async function get_profiles_data() {
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

    // user name role  avartar
    document.getElementById('userName').innerHTML = `<p>${profile.user_name}</p>`;
    document.getElementById('role').innerHTML = `<p>${profile.role}</p>`;

  } catch (p_error) {
    console.log('p_error at func get_product_data: ', p_error);
  }
}
  async function fetch_data_from_flask(tableName, schema='public') {
    try {
        // Sử dụng fetch gửi tên bảng lên Flask
        const response = await fetch('/api/get-table-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ table_name: tableName, schema: schema})
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Lỗi kết nối server');
        }

        if (result.length === 0) { console.log(`bảng ${tableName} chưa tạo rls trong bảng permission`)}
        console.log(`fetch_data_from_flask table-${tableName} data: `, result)
        return result;
        
    } catch (error) {
        console.error("Error:", error);
        return null; // Trả về null nếu lỗi để tránh crash code bên dưới
    }
}
async function fetch_insert_data_from_flask(tableName, row) {
    try {
        // Sử dụng fetch gửi tên bảng lên Flask
        const response = await fetch('/api/insert-table-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ table_name: tableName, row: row })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Lỗi kết nối server');
        }

        !result.message ? console.log(`bảng ${tableName} chưa tạo rls trong bảng permission`): null;
        return result;
        
    } catch (error) {
        console.error("Error:", error);
        return null; // Trả về null nếu lỗi để tránh crash code bên dưới
    }
}