// ===== GLOBAL VARIABLES =====
let canvas, ctx;
let isDrawing = false;
let currentTool = 'pen';
let currentColor = '#667eea';
let currentSize = 5;
let lastX = 0;
let lastY = 0;
let drawingHistory = [];
let historyIndex = -1;

// Data storage for form entries
let userData = [];
let dataTableInstance = null;

// ===== DOCUMENT READY =====
$(document).ready(function() {
  initializeApp();
});

// ===== INITIALIZE APPLICATION =====
function initializeApp() {
  initCanvas();
  initDataTable();
  initFormValidation();
  initSmoothScrolling();
  initAnimations();
  loadUserDataFromStorage();
  
  // Hide loading overlay after everything is loaded
  setTimeout(() => {
    hideLoading();
  }, 1000);
}

// ===== CANVAS FUNCTIONS =====
function initCanvas() {
  canvas = document.getElementById('myCanvas');
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }
  
  ctx = canvas.getContext('2d');
  
  // Set canvas size
  canvas.width = 800;
  canvas.height = 500;
  
  // Set initial canvas background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Configure drawing context
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Save initial state
  saveCanvasState();
  
  // Add event listeners for drawing
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
  
  // Touch events for mobile
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);
  
  // Set initial cursor
  updateCanvasCursor();
  
  console.log('Canvas initialized successfully!');
}

function startDrawing(e) {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
  
  // Start a new path for current stroke
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  
  console.log('Drawing started at:', lastX, lastY);
}

function draw(e) {
  if (!isDrawing) return;
  
  const rect = canvas.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;
  
  drawLine(lastX, lastY, currentX, currentY);
  
  lastX = currentX;
  lastY = currentY;
}

function stopDrawing() {
  if (!isDrawing) return;
  isDrawing = false;
  
  // Save canvas state for undo functionality
  saveCanvasState();
  
  console.log('Drawing stopped');
}

function drawLine(x1, y1, x2, y2) {
  // Set composite operation based on tool
  ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
  
  // Configure drawing style based on tool
  switch(currentTool) {
    case 'pen':
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentSize;
      ctx.globalAlpha = 1;
      break;
    case 'brush':
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentSize * 1.5;
      ctx.globalAlpha = 0.8;
      break;
    case 'pencil':
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentSize * 0.8;
      ctx.globalAlpha = 0.7;
      // Add some texture for pencil effect
      addPencilTexture(x1, y1, x2, y2);
      return;
    case 'marker':
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentSize * 2;
      ctx.globalAlpha = 0.6;
      break;
    case 'eraser':
      ctx.lineWidth = currentSize * 2;
      ctx.globalAlpha = 1;
      break;
  }
  
  // Draw the line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  // Reset alpha
  ctx.globalAlpha = 1;
}

function addPencilTexture(x1, y1, x2, y2) {
  const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const steps = Math.ceil(distance / 2);
  
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 2;
    const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 2;
    
    ctx.fillStyle = currentColor;
    ctx.globalAlpha = 0.1 + Math.random() * 0.3;
    ctx.fillRect(x, y, currentSize * 0.3, currentSize * 0.3);
  }
  ctx.globalAlpha = 1;
}

function setTool(tool) {
  // Remove active class from all tool buttons
  document.querySelectorAll('.tool-group .btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add active class to selected tool
  const toolButton = document.getElementById(tool + 'Tool');
  if (toolButton) {
    toolButton.classList.add('active');
  }
  
  currentTool = tool;
  updateCanvasCursor();
  
  showNotification(`${getToolDisplayName(tool)} dipilih`);
  console.log('Tool changed to:', tool);
}

function getToolDisplayName(tool) {
  const toolNames = {
    'pen': 'Pena',
    'brush': 'Kuas',
    'pencil': 'Pensil',
    'marker': 'Spidol',
    'eraser': 'Penghapus'
  };
  return toolNames[tool] || tool;
}

function updateCanvasCursor() {
  if (canvas) {
    canvas.className = `canvas-modern ${currentTool}-cursor`;
  }
}

function updateBrushSize(size) {
  currentSize = parseInt(size);
  const sizeDisplay = document.getElementById('sizeValue');
  if (sizeDisplay) {
    sizeDisplay.textContent = size;
  }
  console.log('Brush size changed to:', size);
}

function updateColor(color) {
  currentColor = color;
  
  // Update active color swatch
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.classList.remove('active');
  });
  
  console.log('Color changed to:', color);
}

function selectColor(color) {
  currentColor = color;
  const colorPicker = document.getElementById('colorPicker');
  if (colorPicker) {
    colorPicker.value = color;
  }
  
  // Update active color swatch
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.classList.remove('active');
    const swatchColor = swatch.style.background || swatch.style.backgroundColor;
    if (swatchColor === color || 
        swatchColor === `rgb(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)})`) {
      swatch.classList.add('active');
    }
  });
  
  showNotification(`Warna ${color} dipilih`);
  console.log('Color selected:', color);
}

function clearCanvas() {
  // Show confirmation dialog
  if (confirm('Apakah Anda yakin ingin menghapus semua gambar?')) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clear drawing history
    drawingHistory = [];
    historyIndex = -1;
    saveCanvasState();
    
    showNotification('Canvas telah dibersihkan!');
    console.log('Canvas cleared');
  }
}

function saveCanvasState() {
  historyIndex++;
  
  // Remove any history after current index
  if (historyIndex < drawingHistory.length) {
    drawingHistory.splice(historyIndex);
  }
  
  // Save current canvas state
  drawingHistory.push(canvas.toDataURL());
  
  // Limit history to 20 states
  if (drawingHistory.length > 20) {
    drawingHistory.shift();
    historyIndex--;
  }
  
  console.log('Canvas state saved. History length:', drawingHistory.length);
}

function undoLastAction() {
  if (historyIndex > 0) {
    historyIndex--;
    
    const img = new Image();
    img.onload = function() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = drawingHistory[historyIndex];
    
    showNotification('Aksi terakhir dibatalkan');
    console.log('Undo action. History index:', historyIndex);
  } else {
    showNotification('Tidak ada aksi yang dapat dibatalkan', 'error');
    console.log('Nothing to undo');
  }
}

function saveCanvas() {
  // Create download link
  const link = document.createElement('a');
  link.download = `drawing_${new Date().getTime()}.png`;
  link.href = canvas.toDataURL();
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showNotification('Gambar berhasil disimpan!');
  console.log('Canvas saved');
}

function showCanvasInfo() {
  const totalStrokes = historyIndex;
  const canvasSize = `${canvas.width} x ${canvas.height} pixels`;
  
  const infoModal = document.createElement('div');
  infoModal.className = 'modal fade';
  infoModal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content" style="border-radius: 20px; border: none;">
        <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
          <h5 class="modal-title">
            <i class="fas fa-info-circle me-2"></i>Canvas Information
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-4">
          <div class="info-item mb-3">
            <i class="fas fa-ruler-combined text-primary me-2"></i>
            <strong>Canvas Size:</strong> ${canvasSize}
          </div>
          <div class="info-item mb-3">
            <i class="fas fa-paint-brush text-success me-2"></i>
            <strong>Current Tool:</strong> ${getToolDisplayName(currentTool)}
          </div>
          <div class="info-item mb-3">
            <i class="fas fa-palette text-warning me-2"></i>
            <strong>Current Color:</strong> 
            <span class="color-preview" style="background: ${currentColor}; width: 20px; height: 20px; border-radius: 50%; display: inline-block; margin-left: 5px; border: 2px solid #ccc;"></span>
          </div>
          <div class="info-item mb-3">
            <i class="fas fa-circle text-info me-2"></i>
            <strong>Brush Size:</strong> ${currentSize}px
          </div>
          <div class="info-item">
            <i class="fas fa-history text-secondary me-2"></i>
            <strong>Total Actions:</strong> ${totalStrokes}
          </div>
        </div>
        <div class="modal-footer border-0">
          <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
            <i class="fas fa-check me-2"></i>OK
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(infoModal);
  const bootstrapModal = new bootstrap.Modal(infoModal);
  bootstrapModal.show();
  
  infoModal.addEventListener('hidden.bs.modal', () => {
    infoModal.remove();
  });
}

// Touch event handlers for mobile devices
function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  
  isDrawing = true;
  lastX = touch.clientX - rect.left;
  lastY = touch.clientY - rect.top;
  
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  
  console.log('Touch drawing started at:', lastX, lastY);
}

function handleTouchMove(e) {
  e.preventDefault();
  if (!isDrawing) return;
  
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const currentX = touch.clientX - rect.left;
  const currentY = touch.clientY - rect.top;
  
  drawLine(lastX, lastY, currentX, currentY);
  
  lastX = currentX;
  lastY = currentY;
}

// ===== FORM FUNCTIONS =====

// Handle form submission
function handleFormSubmit(event) {
  event.preventDefault();
  
  if (!validateForm()) {
    return false;
  }
  
  const formData = getFormData();
  const editIndex = document.getElementById('editIndex').value;
  
  if (editIndex !== '') {
    // Update existing data
    userData[parseInt(editIndex)] = formData;
    showNotification('Data berhasil diupdate!', 'success');
  } else {
    // Add new data
    userData.push(formData);
    showNotification('Data berhasil ditambahkan!', 'success');
  }
  
  // Save to localStorage
  saveUserDataToStorage();
  
  // Refresh table
  refreshDataTable();
  
  // Reset form
  resetForm();
  
  // Scroll to table
  setTimeout(() => {
    document.getElementById('table-section').scrollIntoView({ behavior: 'smooth' });
  }, 500);
  
  return false;
}

// Get form data
function getFormData() {
  const provinsiSelect = document.getElementById('provinsi');
  const kotaSelect = document.getElementById('kota');
  
  // Get selected provinsi and kota names
  const provinsiName = provinsiSelect.options[provinsiSelect.selectedIndex]?.getAttribute('data-nama') || 
                       provinsiSelect.options[provinsiSelect.selectedIndex]?.text || '';
  const kotaName = kotaSelect.options[kotaSelect.selectedIndex]?.getAttribute('data-nama') || 
                   kotaSelect.options[kotaSelect.selectedIndex]?.text || '';
  
  // Get hobi yang dipilih
  const hobiCheckboxes = document.querySelectorAll('input[name="hobi"]:checked');
  const hobiArray = Array.from(hobiCheckboxes).map(cb => cb.value);
  
  return {
    nama: document.getElementById('nama').value,
    umur: document.getElementById('umur').value,
    provinsi: provinsiName,
    provinsiId: document.getElementById('provinsi').value,
    kota: kotaName,
    kotaId: document.getElementById('kota').value,
    jenisKelamin: document.querySelector('input[name="jk"]:checked')?.value || '',
    hobi: hobiArray,
    pesan: document.getElementById('pesan').value,
    timestamp: new Date().toISOString()
  };
}

// Reset form
function resetForm() {
  document.getElementById('myForm').reset();
  document.getElementById('editIndex').value = '';
  document.getElementById('submitBtn').innerHTML = '<i class="fas fa-paper-plane me-2"></i>Tambah Data';
  document.getElementById('cancelBtn').style.display = 'none';
  
  // Reset kota dropdown
  const kotaSelect = document.getElementById('kota');
  kotaSelect.innerHTML = '<option value="">Pilih Kota/Kabupaten</option>';
  kotaSelect.disabled = true;
}

// Cancel edit
function cancelEdit() {
  resetForm();
  showNotification('Edit dibatalkan', 'info');
}

// Edit data
function editData(index) {
  const data = userData[index];
  
  // Fill form with data
  document.getElementById('nama').value = data.nama;
  document.getElementById('umur').value = data.umur;
  document.getElementById('provinsi').value = data.provinsiId;
  
  // Load kota for selected provinsi
  populateKabupatenKotaDropdown(data.provinsiId).then(() => {
    document.getElementById('kota').value = data.kotaId;
  });
  
  // Set jenis kelamin
  if (data.jenisKelamin === 'Laki-laki') {
    document.getElementById('laki').checked = true;
  } else if (data.jenisKelamin === 'Perempuan') {
    document.getElementById('perempuan').checked = true;
  }
  
  // Set hobi
  document.querySelectorAll('input[name="hobi"]').forEach(cb => {
    cb.checked = data.hobi.includes(cb.value);
  });
  
  document.getElementById('pesan').value = data.pesan;
  document.getElementById('editIndex').value = index;
  
  // Update button text
  document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save me-2"></i>Update Data';
  document.getElementById('cancelBtn').style.display = 'inline-block';
  
  // Scroll to form
  setTimeout(() => {
    document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
  }, 300);
  
  showNotification('Mode edit aktif. Ubah data dan klik Update.', 'info');
}

// Delete data
function deleteData(index) {
  const data = userData[index];
  
  if (confirm(`Apakah Anda yakin ingin menghapus data "${data.nama}"?`)) {
    userData.splice(index, 1);
    saveUserDataToStorage();
    refreshDataTable();
    showNotification('Data berhasil dihapus!', 'success');
  }
}

// Refresh DataTable
function refreshDataTable() {
  if (dataTableInstance) {
    dataTableInstance.destroy();
  }
  
  const tableBody = document.getElementById('tableBody');
  tableBody.innerHTML = '';
  
  userData.forEach((data, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${data.nama}</td>
      <td>${data.umur}</td>
      <td>${data.provinsi}</td>
      <td>${data.kota}</td>
      <td>${data.jenisKelamin}</td>
      <td>${data.hobi.join(', ') || '-'}</td>
      <td>${data.pesan || '-'}</td>
      <td class="text-nowrap">
        <button class="btn btn-sm btn-warning me-1" onclick="editData(${index})" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteData(${index})" title="Hapus">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });
  
  // Reinitialize DataTable
  initDataTable();
}

// Save userData to localStorage
function saveUserDataToStorage() {
  try {
    localStorage.setItem('userData', JSON.stringify(userData));
    console.log('Data saved to localStorage');
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// Load userData from localStorage
function loadUserDataFromStorage() {
  try {
    const stored = localStorage.getItem('userData');
    if (stored) {
      userData = JSON.parse(stored);
      console.log('Data loaded from localStorage:', userData.length, 'records');
      refreshDataTable();
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    userData = [];
  }
}

function loadKota() {
  const provinsiSelect = document.getElementById('provinsi');
  const provinsiId = provinsiSelect.value;
  
  if (!provinsiId) {
    const kotaSelect = document.getElementById('kota');
    kotaSelect.innerHTML = '<option value="">Pilih Kota/Kabupaten</option>';
    kotaSelect.disabled = true;
    return;
  }
  
  // Show loading
  showLoading();
  
  // Load kabupaten/kota from API
  populateKabupatenKotaDropdown(provinsiId).finally(() => {
    hideLoading();
  });
}

function initFormValidation() {
  const form = document.getElementById('myForm');
  if (!form) return;
  
  // Add real-time validation
  const inputs = form.querySelectorAll('input[required], select[required]');
  inputs.forEach(input => {
    input.addEventListener('blur', validateField);
    input.addEventListener('input', clearFieldError);
  });
}

function validateField(e) {
  const field = e.target;
  const value = field.value.trim();
  
  clearFieldError(e);
  
  if (!value && field.hasAttribute('required')) {
    showFieldError(field, 'Field ini wajib diisi');
    return false;
  }
  
  // Specific validations
  switch(field.type) {
    case 'text':
      if (field.id === 'nama' && value.length < 2) {
        showFieldError(field, 'Nama minimal 2 karakter');
        return false;
      }
      break;
    case 'number':
      if (field.id === 'umur') {
        const age = parseInt(value);
        if (age < 1 || age > 120) {
          showFieldError(field, 'Umur harus antara 1-120 tahun');
          return false;
        }
      }
      break;
  }
  
  return true;
}

function clearFieldError(e) {
  const field = e.target;
  field.classList.remove('is-invalid');
  const errorElement = field.parentNode.querySelector('.invalid-feedback');
  if (errorElement) {
    errorElement.remove();
  }
}

function showFieldError(field, message) {
  field.classList.add('is-invalid');
  
  const errorElement = document.createElement('div');
  errorElement.className = 'invalid-feedback';
  errorElement.textContent = message;
  field.parentNode.appendChild(errorElement);
}

function validateForm() {
  const form = document.getElementById('myForm');
  if (!form) return false;
  
  const requiredFields = form.querySelectorAll('input[required], select[required]');
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      showFieldError(field, 'Field ini wajib diisi');
      isValid = false;
    }
  });
  
  // Check radio buttons
  const genderRadios = form.querySelectorAll('input[name="jk"]');
  const isGenderSelected = Array.from(genderRadios).some(radio => radio.checked);
  
  if (!isGenderSelected) {
    showNotification('Silakan pilih jenis kelamin', 'error');
    isValid = false;
  }
  
  return isValid;
}

// ===== DATATABLE FUNCTIONS =====
function initDataTable() {
  const dataTable = $('#dataTable');
  if (dataTable.length === 0) return;
  
  dataTableInstance = dataTable.DataTable({
    dom: 'Bfrtip',
    buttons: [
      {
        extend: 'copyHtml5',
        text: '<i class="fas fa-copy me-1"></i>Copy',
        className: 'btn btn-outline-primary btn-sm',
        exportOptions: {
          columns: ':not(:last-child)' // Exclude action column
        }
      },
      {
        extend: 'excelHtml5',
        text: '<i class="fas fa-file-excel me-1"></i>Excel',
        className: 'btn btn-outline-success btn-sm',
        exportOptions: {
          columns: ':not(:last-child)'
        }
      },
      {
        extend: 'csvHtml5',
        text: '<i class="fas fa-file-csv me-1"></i>CSV',
        className: 'btn btn-outline-info btn-sm',
        exportOptions: {
          columns: ':not(:last-child)'
        }
      },
      {
        extend: 'pdfHtml5',
        text: '<i class="fas fa-file-pdf me-1"></i>PDF',
        className: 'btn btn-outline-danger btn-sm',
        orientation: 'landscape',
        pageSize: 'LEGAL',
        exportOptions: {
          columns: ':not(:last-child)'
        }
      }
    ],
    responsive: true,
    pageLength: 10,
    order: [[0, 'asc']],
    language: {
      search: "Cari:",
      lengthMenu: "Tampilkan _MENU_ data per halaman",
      info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
      infoEmpty: "Menampilkan 0 sampai 0 dari 0 data",
      infoFiltered: "(disaring dari _MAX_ total data)",
      zeroRecords: "Tidak ada data yang ditemukan",
      emptyTable: "Belum ada data. Silakan tambahkan data melalui form di atas.",
      paginate: {
        first: "Pertama",
        last: "Terakhir",
        next: "Selanjutnya",
        previous: "Sebelumnya"
      }
    }
  });
}

// ===== UI FUNCTIONS =====
function showLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('show');
  }
}

function hideLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.classList.remove('show');
  }
}

function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification-toast');
  existingNotifications.forEach(notification => notification.remove());
  
  // Determine icon and color based on type
  let icon, bgColor, textColor;
  switch(type) {
    case 'error':
      icon = 'exclamation-triangle';
      bgColor = '#dc3545';
      textColor = 'white';
      break;
    case 'warning':
      icon = 'exclamation-circle';
      bgColor = '#ffc107';
      textColor = '#000';
      break;
    case 'success':
      icon = 'check-circle';
      bgColor = '#28a745';
      textColor = 'white';
      break;
    default:
      icon = 'info-circle';
      bgColor = '#17a2b8';
      textColor = 'white';
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'notification-toast';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    min-width: 300px;
    max-width: 400px;
    background: ${bgColor};
    color: ${textColor};
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    animation: slideInRight 0.5s ease-out;
    display: flex;
    align-items: center;
    gap: 12px;
  `;
  
  notification.innerHTML = `
    <i class="fas fa-${icon}" style="font-size: 1.5rem;"></i>
    <span style="flex: 1;">${message}</span>
    <button onclick="this.parentElement.remove()" style="background: none; border: none; color: ${textColor}; cursor: pointer; font-size: 1.2rem; opacity: 0.8;">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOutRight 0.5s ease-out';
      setTimeout(() => notification.remove(), 500);
    }
  }, 5000);
}

function showSuccessMessage(message) {
  // Create success modal
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content" style="border-radius: 20px; border: none;">
        <div class="modal-body text-center p-5">
          <div class="mb-4">
            <i class="fas fa-check-circle text-success" style="font-size: 4rem;"></i>
          </div>
          <h4 class="mb-3">Berhasil!</h4>
          <p class="text-muted">${message}</p>
          <button type="button" class="btn btn-success btn-lg" data-bs-dismiss="modal">
            <i class="fas fa-thumbs-up me-2"></i>OK
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const bootstrapModal = new bootstrap.Modal(modal);
  bootstrapModal.show();
  
  // Remove modal after hiding
  modal.addEventListener('hidden.bs.modal', () => {
    modal.remove();
  });
}

function initSmoothScrolling() {
  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

function initAnimations() {
  // Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeInUp 0.8s ease-out forwards';
      }
    });
  }, observerOptions);
  
  // Observe all cards and main content divs
  document.querySelectorAll('.card, #form-section, #canvas-section, #table-section').forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    observer.observe(element);
  });
}

// ===== UTILITY FUNCTIONS =====
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(amount);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ===== EVENT LISTENERS =====
window.addEventListener('load', function() {
  // Add loading completed class to body
  document.body.classList.add('loaded');
});

window.addEventListener('scroll', debounce(() => {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    if (window.scrollY > 100) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
}, 10));

// Prevent accidental page leave if there's unsaved data
window.addEventListener('beforeunload', function(e) {
  const editIndex = document.getElementById('editIndex');
  if (editIndex && editIndex.value !== '') {
    e.preventDefault();
    e.returnValue = 'Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman?';
    return e.returnValue;
  }
});

// ===== EXPOSE GLOBAL FUNCTIONS =====
window.loadKota = loadKota;
window.setTool = setTool;
window.updateBrushSize = updateBrushSize;
window.updateColor = updateColor;
window.selectColor = selectColor;
window.clearCanvas = clearCanvas;
window.undoLastAction = undoLastAction;
window.saveCanvas = saveCanvas;
window.showCanvasInfo = showCanvasInfo;
window.handleFormSubmit = handleFormSubmit;
window.editData = editData;
window.deleteData = deleteData;
window.cancelEdit = cancelEdit;

// ===== INITIALIZATION LOG =====
console.log('Script loaded successfully!');
console.log('Features available:');
console.log('- Form Input & Validation');
console.log('- CRUD Operations (Create, Read, Update, Delete)');
console.log('- Drawing Canvas with Multiple Tools');
console.log('- DataTable with Export (Excel, PDF, CSV)');
console.log('- Provinsi & Kota/Kabupaten from API');
console.log('- LocalStorage for Data Persistence');