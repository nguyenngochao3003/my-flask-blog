

    // 1. DỮ LIỆU MẪU (Mô phỏng Database)
    const db = [
      {
        id: "wh-1",
        name: "Kho Nguyên Vật Liệu A",
        location: "Nhà máy 1 - Củ Chi",
        manager: "Nguyễn Văn A",
        type: "Kho khô",
        capacity: 78,
        racks: [
          {
            id: "rack-101",
            code: "KỆ K01",
            zone: "Dãy A (Heavy Duty)",
            maxWeight: "5.000 kg",
            capacity: 55,
            floors: [
              {
                floorName: "TẦNG 3 (Hàng nhẹ)",
                cells: [
                  { code: "K01-T3-O1", sku: "PK-0012", name: "Thùng carton 3L", qty: "150 Thùng", empty: false },
                  { code: "K01-T3-O2", empty: true, maxCap: "200 kg" },
                  { code: "K01-T3-O3", sku: "PK-0099", name: "Màng PE quấn", qty: "20 Cuộn", empty: false }
                ]
              },
              {
                floorName: "TẦNG 1 (Hàng nặng/Pallet)",
                cells: [
                  { code: "K01-T1-O1", sku: "NL-0001", name: "Thép cuộn 1.2mm", qty: "2 Pallet (1.5T)", empty: false },
                  { code: "K01-T1-O2", sku: "NL-0002", name: "Thép cuộn 2.0mm", qty: "3 Pallet (2.1T)", empty: false }
                ]
              }
            ]
          },
          {
            id: "rack-102",
            code: "KỆ K02",
            zone: "Dãy A (Heavy Duty)",
            maxWeight: "5.000 kg",
            capacity: 95,
            floors: []
          }
        ]
      },
      {
        id: "wh-2",
        name: "Kho Thành Phẩm B",
        location: "Khu CN Tân Bình",
        manager: "Trần Thị B",
        type: "Kho mát (18°C)",
        capacity: 95,
        racks: []
      }
    ];

    // Biến lưu trạng thái điều hướng
    let currentWh = null;
    let currentRack = null;

    // Helper: Lấy màu theo % capacity
    function getStatusClass(cap) {
      if (cap >= 90) return 'bg-danger';
      if (cap >= 70) return 'bg-warning';
      return 'bg-success';
    }

    // 2. RENDER TẦNG 1: DANH SÁCH KHO
    function renderWarehouses() {
      const container = document.getElementById('warehouseList');
      container.innerHTML = db.map(wh => `
        <div class="card">
          <div>
            <div class="card-title">🏢 ${wh.name}</div>
            <div class="card-meta">📍 ${wh.location}</div>
            <div class="card-meta">👤 Quản lý: ${wh.manager}</div>
            <div class="card-meta">🏷️ Loại: ${wh.type}</div>
            <div class="progress-container">
              <div class="progress-label">
                <span>Sức chứa</span>
                <strong>${wh.capacity}%</strong>
              </div>
              <div class="progress-bar">
                <div class="progress-fill ${getStatusClass(wh.capacity)}" style="width: ${wh.capacity}%"></div>
              </div>
            </div>
          </div>
          <button class="btn btn-primary" onclick="openWarehouse('${wh.id}')">👁️ Xem chi tiết sơ đồ kho</button>
        </div>
      `).join('');
    }

    // 3. RENDER TẦNG 2: DANH SÁCH KỆ
    function openWarehouse(whId) {
      currentWh = db.find(w => w.id === whId);
      renderBreadcrumb();

      document.getElementById('actionButtons').innerHTML = `<button class="btn btn-primary" onclick="alert('Mở Popup Tạo Kệ Mới')">+ Tạo Kệ Mới</button>`;
      
      const container = document.getElementById('rackList');
      if(currentWh.racks.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted)">Kho này chưa có kệ nào.</p>`;
      } else {
        container.innerHTML = currentWh.racks.map(rack => `
          <div class="card">
            <div>
              <div class="img-placeholder">🖼️ Hình ảnh Kệ ${rack.code}</div>
              <div class="card-title">📌 ${rack.code} - ${rack.zone}</div>
              <div class="card-meta">⚖️ Tải trọng tối đa: ${rack.maxWeight}</div>
              <div class="progress-container">
                <div class="progress-label">
                  <span>Mức độ lấp đầy</span>
                  <strong>${rack.capacity}%</strong>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill ${getStatusClass(rack.capacity)}" style="width: ${rack.capacity}%"></div>
                </div>
              </div>
            </div>
            <button class="btn btn-primary" onclick="openRack('${rack.id}')">👁️ Vào xem ô Cell</button>
          </div>
        `).join('');
      }

      showLevel(2);
    }

    // 4. RENDER TẦNG 3: MA TRẬN CELL
    function openRack(rackId) {
      currentRack = currentWh.racks.find(r => r.id === rackId);
      renderBreadcrumb();

      document.getElementById('actionButtons').innerHTML = `
        <button class="btn btn-primary" onclick="alert('Nhập hàng')">➕ Nhập hàng</button>
        <button class="btn btn-secondary" onclick="alert('Chuyển vị trí')">🔄 Chuyển ô</button>
      `;

      const container = document.getElementById('cellMatrix');
      if(currentRack.floors.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted)">Kệ này chưa có cấu hình ô Cell.</p>`;
      } else {
        container.innerHTML = currentRack.floors.map(floor => `
          <div class="shelf-floor">
            <div class="shelf-floor-title">[ ${floor.floorName} ]</div>
            <div class="cells-grid">
              ${floor.cells.map(cell => cell.empty ? `
                <div class="cell-box empty">
                  <div class="cell-code">${cell.code}</div>
                  <div class="cell-info" style="color: var(--text-muted);">⚪ (Ô TRỐNG)<br>Sức chứa: ${cell.maxCap}</div>
                  <div class="cell-actions">
                    <button class="btn btn-primary btn-sm" onclick="alert('Nhập hàng vào ${cell.code}')">➕ Nhập</button>
                  </div>
                </div>
              ` : `
                <div class="cell-box">
                  <div class="cell-code">${cell.code}</div>
                  <div class="cell-info">
                    <strong>📦 ${cell.name}</strong><br>
                    SKU: ${cell.sku}<br>
                    SL: <strong>${cell.qty}</strong>
                  </div>
                  <div class="cell-actions">
                    <button class="btn btn-secondary btn-sm" onclick="alert('Xuất hàng từ ${cell.code}')">📦 Xuất</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('');
      }

      showLevel(3);
    }

    // 5. ĐIỀU HƯỚNG GIAO DIỆN (BREADCRUMB & LEVEL SWITCHING)
    function showLevel(level) {
      document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
      document.getElementById(`level${level}`).classList.add('active');
      
      if(level === 1) {
        currentWh = null;
        currentRack = null;
        document.getElementById('actionButtons').innerHTML = `<button class="btn btn-primary" onclick="alert('Mở Popup Tạo Kho Mới')">+ Tạo Kho Mới</button>`;
      } else if(level === 2) {
        currentRack = null;
      }
      renderBreadcrumb();
    }

    function renderBreadcrumb() {
      const bc = document.getElementById('breadcrumb');
      let html = `<span onclick="showLevel(1)">Tổng quan Kho</span>`;
      
      if (currentWh) {
        html += ` &gt; <span onclick="${currentRack ? 'showLevel(2)' : ''}" class="${!currentRack ? 'current' : ''}">${currentWh.name}</span>`;
      }
      if (currentRack) {
        html += ` &gt; <span class="current">${currentRack.code}</span>`;
      }
      bc.innerHTML = html;
    }

    // Khoột khởi chạy ban đầu
    renderWarehouses();


    //==================================================================
    //==================================================================
    // 1. CẤU HÌNH KẾT NỐI SUPABASE
    const supabaseClient = window.userSupabase;
    console.log('>>>>>>>supabaseClient: ', supabaseClient);
    // Dynamic Variables
    let html5QrcodeScanner = null;
    let currentActionType = 'IN'; // 'IN' hoặc 'OUT'
    let mediaStream = null;
    let capturedBlob = null;

    // 2. CHUYỂN ĐỔI MÀN HÌNH
    function showLevel(level) {
      document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
      if(level === 'L1') document.getElementById('viewL1').classList.add('active');
      if(level === 'L2') document.getElementById('viewL2').classList.add('active');
      if(level === 'REPORT') {
        document.getElementById('viewReport').classList.add('active');
        loadReportData();
      }
    }

    // 3. MỞ MODAL THAO TÁC NHẬP / XUẤT NHANH
    function openQuickActionModal(type) {
      currentActionType = type;
      const modal = document.getElementById('actionModal');
      const title = document.getElementById('modalTitle');
      const submitBtn = document.getElementById('btnSubmitAction');

      if(type === 'IN') {
        title.innerText = "📥 NHẬP HÀNG NHANH VÀO KỆ";
        submitBtn.className = "btn btn-in";
        submitBtn.innerText = "Xác Nhận Nhập Kho";
      } else {
        title.innerText = "📤 XUẤT HÀNG NHANH KHỎI KỆ";
        submitBtn.className = "btn btn-out";
        submitBtn.innerText = "Xác Nhận Xuất Kho";
      }

      modal.classList.add('active');
      startQRScanner();
      startCameraStream();
    }

    function closeModal() {
      document.getElementById('actionModal').classList.remove('active');
      stopQRScanner();
      stopCameraStream();
    }

    // 4. QUÉT MÃ QR (HTML5-QRCode)
    function startQRScanner() {
      html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 200 });
      html5QrcodeScanner.render((decodedText) => {
        // Tự động gán mã ô kệ khi quét thành công
        document.getElementById('inputCellCode').value = decodedText;
        // Báo âm thanh hoặc hiệu ứng nhẹ
      });
    }

    function stopQRScanner() {
      if(html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(error => console.error(error));
      }
    }

    // 5. CHỤP ẢNH HIỆN TRẠNG TỪ CAMERA
    async function startCameraStream() {
      try {
        const video = document.getElementById('cameraPreview');
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = mediaStream;
      } catch (err) {
        console.error("Lỗi mở camera chụp ảnh: ", err);
      }
    }

    function stopCameraStream() {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    }

    function takeSnapshot() {
      const video = document.getElementById('cameraPreview');
      const canvas = document.getElementById('snapshotCanvas');
      const preview = document.getElementById('snapshotPreview');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        capturedBlob = blob;
        preview.src = URL.createObjectURL(blob);
        preview.style.display = 'block';
      }, 'image/jpeg', 0.8);
    }

    // 6. TẢI ẢNH LÊN SUPABASE BUCKET & LƯU LOG VÀO DATABASE
    async function submitInventoryAction() {
      const cellCode = document.getElementById('inputCellCode').value;
      const sku = document.getElementById('inputSKU').value;
      const qty = document.getElementById('inputQty').value;

      if(!cellCode || !sku) {
        alert("Vui lòng quét QR vị trí kệ và nhập mã SKU!");
        return;
      }

      let imageUrl = null;

      // Upload ảnh lên Supabase Storage
      if (capturedBlob) {
        const fileName = `inventory_${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('wms-images')
          .upload(fileName, capturedBlob, { contentType: 'image/jpeg' });

        if (uploadError) {
          alert("Lỗi tải ảnh lên Supabase: " + uploadError.message);
        } else {
          // Lấy public URL của ảnh
          const { data: urlData } = supabaseClient.storage
            .from('wms-images')
            .getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      }

      // Lưu log lịch sử giao dịch vào bảng Database 'inventory_logs'
      const { error: dbError } = await supabaseClient
        .from('inventory_logs')
        .insert([
          {
            type: currentActionType,
            cell_code: cellCode,
            sku: sku,
            quantity: parseInt(qty),
            image_url: imageUrl,
            created_at: new Date().toISOString()
          }
        ]);

      if (dbError) {
        alert("Lỗi lưu dữ liệu: " + dbError.message);
      } else {
        alert("Cập nhật kho và lưu ảnh hiện trạng thành công!");
        closeModal();
      }
    }

    // 7. LOAD DỮ LIỆU BÁO CÁO TỪ SUPABASE
    async function loadReportData() {
      const tbody = document.getElementById('reportTableBody');
      tbody.innerHTML = "<tr><td colspan='6'>Đang tải báo cáo...</td></tr>";

      const { data, error } = await supabaseClient
        .from('inventory_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        tbody.innerHTML = `<tr><td colspan='6' style='color:red'>Lỗi: ${error.message}</td></tr>`;
        return;
      }

      if (data.length === 0) {
        tbody.innerHTML = "<tr><td colspan='6'>Chưa có giao dịch nào được ghi nhận.</td></tr>";
        return;
      }

      tbody.innerHTML = data.map(row => `
        <tr>
          <td>${new Date(row.created_at).toLocaleString('vi-VN')}</td>
          <td><strong style="color: ${row.type === 'IN' ? 'var(--success)' : 'var(--danger)'}">
            ${row.type === 'IN' ? '📥 Nhập Kho' : '📤 Xuất Kho'}
          </strong></td>
          <td>${row.cell_code}</td>
          <td>${row.sku}</td>
          <td>${row.quantity}</td>
          <td>
            ${row.image_url ? `<a href="${row.image_url}" target="_blank"><img src="${row.image_url}" style="width:60px; height:40px; object-fit:cover; border-radius:4px;"></a>` : 'Không có ảnh'}
          </td>
        </tr>
      `).join('');
    }
    window.loadReportData = loadReportData;
    window.submitInventoryAction = submitInventoryAction;
    window.takeSnapshot = takeSnapshot;
    window.stopCameraStream = stopCameraStream;
    window.startCameraStream = startCameraStream;
    window.stopQRScanner = stopQRScanner;
    window.startQRScanner = startQRScanner;
    window.closeModal = closeModal;
    window.openQuickActionModal = openQuickActionModal;
    window.showLevel = showLevel;
    window.openRack = openRack;


