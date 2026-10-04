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