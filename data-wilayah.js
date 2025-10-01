let dataProvinsi = [];
let dataKabupatenKota = {};

const API_BASE_URL = 'https://ibnux.github.io/data-indonesia/';
const API_TIMEOUT = 5000; 

async function fetchWithTimeout(url, timeout = API_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

async function loadProvinsiFromAPI() {
  try {
    showLoadingMessage('Memuat data provinsi dari API...');
    console.log('Fetching provinsi from API...');
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/provinsi.json`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    dataProvinsi = data.data || data;
    
    console.log('✅ Provinsi loaded from API:', dataProvinsi.length, 'provinsi');
    
    populateProvinsiDropdown();
    
    hideLoadingMessage();
    
    if (typeof showNotification === 'function') {
      showNotification(`${dataProvinsi.length} provinsi berhasil dimuat dari server`);
    }
    
    return dataProvinsi;
  } catch (error) {
    console.error('❌ Error loading provinsi from API:', error.message);
    hideLoadingMessage();
    
    if (typeof showNotification === 'function') {
      showNotification('API lambat/tidak tersedia. Menggunakan data offline.', 'warning');
    }
    
    useFallbackProvinsi();
    return dataProvinsi;
  }
}

async function loadKabupatenKotaFromAPI(provinsiId) {
  try {
    if (dataKabupatenKota[provinsiId]) {
      console.log('✅ Using cached data for provinsi:', provinsiId);
      return dataKabupatenKota[provinsiId];
    }
    
    showLoadingMessage('Memuat data kabupaten/kota...');
    console.log('Fetching kabupaten/kota for provinsi:', provinsiId);
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/kabupaten/${provinsiId}.json`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const kabupatenKota = data.data || data;
    
    dataKabupatenKota[provinsiId] = kabupatenKota;
    
    console.log('✅ Kabupaten/Kota loaded for provinsi', provinsiId, ':', kabupatenKota.length, 'kab/kota');
    
    hideLoadingMessage();
    
    return kabupatenKota;
  } catch (error) {
    console.error('❌ Error loading kabupaten/kota:', error.message);
    hideLoadingMessage();
    
    if (typeof showNotification === 'function') {
      showNotification('Gagal memuat data kota/kabupaten. Silakan coba lagi.', 'error');
    }
    
    return [];
  }
}

function populateProvinsiDropdown() {
  const provinsiSelect = document.getElementById('provinsi');
  
  if (!provinsiSelect) {
    console.warn('Provinsi select element not found');
    return;
  }
  
  provinsiSelect.innerHTML = '<option value="">Pilih Provinsi</option>';
  
  const sortedProvinsi = [...dataProvinsi].sort((a, b) => {
    const nameA = a.nama || a.name || '';
    const nameB = b.nama || b.name || '';
    return nameA.localeCompare(nameB);
  });
  
  sortedProvinsi.forEach(provinsi => {
    const option = document.createElement('option');
    option.value = provinsi.id || provinsi.kode;
    option.textContent = provinsi.nama || provinsi.name;
    option.setAttribute('data-nama', provinsi.nama || provinsi.name);
    provinsiSelect.appendChild(option);
  });
  
  console.log('Provinsi dropdown populated with', sortedProvinsi.length, 'options');
}

async function populateKabupatenKotaDropdown(provinsiId) {
  const kotaSelect = document.getElementById('kota');
  
  if (!kotaSelect) {
    console.warn('Kota select element not found');
    return;
  }
  
  kotaSelect.innerHTML = '<option value="">Loading...</option>';
  kotaSelect.disabled = true;
  
  if (!provinsiId) {
    kotaSelect.innerHTML = '<option value="">Pilih Kota/Kabupaten</option>';
    kotaSelect.disabled = true;
    return;
  }
  
  try {

    const kabupatenKota = await loadKabupatenKotaFromAPI(provinsiId);
    
    kotaSelect.innerHTML = '<option value="">Pilih Kota/Kabupaten</option>';
    
    if (kabupatenKota && kabupatenKota.length > 0) {
      const sortedKota = [...kabupatenKota].sort((a, b) => {
        const nameA = a.nama || a.name || '';
        const nameB = b.nama || b.name || '';
        return nameA.localeCompare(nameB);
      });
      
      sortedKota.forEach(kota => {
        const option = document.createElement('option');
        option.value = kota.id || kota.kode;
        option.textContent = kota.nama || kota.name;
        option.setAttribute('data-nama', kota.nama || kota.name);
        kotaSelect.appendChild(option);
      });
      
      kotaSelect.disabled = false;
      
      if (typeof showNotification === 'function') {
        const provinsiName = getProvinsiNameById(provinsiId);
        showNotification(`${kabupatenKota.length} kota/kabupaten tersedia untuk ${provinsiName}`);
      }
      
      console.log('Kabupaten/Kota dropdown populated with', kabupatenKota.length, 'options');
    } else {
      kotaSelect.innerHTML = '<option value="">Tidak ada data</option>';
      kotaSelect.disabled = true;
      
      if (typeof showNotification === 'function') {
        showNotification('Data kota/kabupaten tidak ditemukan', 'error');
      }
    }
  } catch (error) {
    console.error('Error populating kabupaten/kota dropdown:', error);
    kotaSelect.innerHTML = '<option value="">Error loading data</option>';
    kotaSelect.disabled = true;
  }
}

function getProvinsiNameById(provinsiId) {
  const provinsi = dataProvinsi.find(p => (p.id || p.kode) == provinsiId);
  return provinsi ? (provinsi.nama || provinsi.name) : '';
}

function getKabupatenKotaNameById(provinsiId, kotaId) {
  if (!dataKabupatenKota[provinsiId]) return '';
  
  const kota = dataKabupatenKota[provinsiId].find(k => (k.id || k.kode) == kotaId);
  return kota ? (kota.nama || kota.name) : '';
}

function getAllProvinsi() {
  return dataProvinsi;
}

function getKabupatenKotaByProvinsiId(provinsiId) {
  return dataKabupatenKota[provinsiId] || [];
}

function searchProvinsi(keyword) {
  const searchTerm = keyword.toLowerCase();
  return dataProvinsi.filter(provinsi => {
    const nama = provinsi.nama || provinsi.name || '';
    return nama.toLowerCase().includes(searchTerm);
  });
}

function searchKabupatenKota(keyword) {
  const results = [];
  const searchTerm = keyword.toLowerCase();
  
  for (const [provinsiId, kotaList] of Object.entries(dataKabupatenKota)) {
    for (const kota of kotaList) {
      const namaKota = kota.nama || kota.name || '';
      if (namaKota.toLowerCase().includes(searchTerm)) {
        results.push({
          kota: kota,
          provinsiId: provinsiId,
          provinsiName: getProvinsiNameById(provinsiId)
        });
      }
    }
  }
  
  return results;
}

function getTotalProvinsi() {
  return dataProvinsi.length;
}

function getTotalKabupatenKota() {
  let total = 0;
  for (const kotaList of Object.values(dataKabupatenKota)) {
    total += kotaList.length;
  }
  return total;
}

function showLoadingMessage(message) {
  console.log(message);
  if (typeof showLoading === 'function') {
    showLoading();
  }
}

function hideLoadingMessage() {
  console.log('Loading complete');
  if (typeof hideLoading === 'function') {
    hideLoading();
  }
}

// function showErrorMessage(message) {
//   console.error('⚠️', message);
//   if (typeof showNotification === 'function') {
//     showNotification(message, 'warning');
//   } else {
//     alert(message);
//   }
// }

function useFallbackProvinsi() {
  console.log('⚠️ Using fallback offline data');
  
  dataProvinsi = [
    { id: '11', nama: 'ACEH' },
    { id: '12', nama: 'SUMATERA UTARA' },
    { id: '13', nama: 'SUMATERA BARAT' },
    { id: '14', nama: 'RIAU' },
    { id: '15', nama: 'JAMBI' },
    { id: '16', nama: 'SUMATERA SELATAN' },
    { id: '17', nama: 'BENGKULU' },
    { id: '18', nama: 'LAMPUNG' },
    { id: '19', nama: 'KEPULAUAN BANGKA BELITUNG' },
    { id: '21', nama: 'KEPULAUAN RIAU' },
    { id: '31', nama: 'DKI JAKARTA' },
    { id: '32', nama: 'JAWA BARAT' },
    { id: '33', nama: 'JAWA TENGAH' },
    { id: '34', nama: 'DAERAH ISTIMEWA YOGYAKARTA' },
    { id: '35', nama: 'JAWA TIMUR' },
    { id: '36', nama: 'BANTEN' },
    { id: '51', nama: 'BALI' },
    { id: '52', nama: 'NUSA TENGGARA BARAT' },
    { id: '53', nama: 'NUSA TENGGARA TIMUR' },
    { id: '61', nama: 'KALIMANTAN BARAT' },
    { id: '62', nama: 'KALIMANTAN TENGAH' },
    { id: '63', nama: 'KALIMANTAN SELATAN' },
    { id: '64', nama: 'KALIMANTAN TIMUR' },
    { id: '65', nama: 'KALIMANTAN UTARA' },
    { id: '71', nama: 'SULAWESI UTARA' },
    { id: '72', nama: 'SULAWESI TENGAH' },
    { id: '73', nama: 'SULAWESI SELATAN' },
    { id: '74', nama: 'SULAWESI TENGGARA' },
    { id: '75', nama: 'GORONTALO' },
    { id: '76', nama: 'SULAWESI BARAT' },
    { id: '81', nama: 'MALUKU' },
    { id: '82', nama: 'MALUKU UTARA' },
    { id: '91', nama: 'PAPUA' },
    { id: '92', nama: 'PAPUA BARAT' },
    { id: '93', nama: 'PAPUA SELATAN' },
    { id: '94', nama: 'PAPUA TENGAH' },
    { id: '95', nama: 'PAPUA PEGUNUNGAN' },
    { id: '96', nama: 'PAPUA BARAT DAYA' }
  ];
  
  populateProvinsiDropdown();
  console.log('✅ Fallback data ready:', dataProvinsi.length, 'provinsi');
}

function initializeDataWilayah() {
  console.log('Initializing Data Wilayah from API...');
  loadProvinsiFromAPI();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDataWilayah);
} else {
  initializeDataWilayah();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadProvinsiFromAPI,
    loadKabupatenKotaFromAPI,
    populateProvinsiDropdown,
    populateKabupatenKotaDropdown,
    getAllProvinsi,
    getKabupatenKotaByProvinsiId,
    getProvinsiNameById,
    getKabupatenKotaNameById,
    searchProvinsi,
    searchKabupatenKota,
    getTotalProvinsi,
    getTotalKabupatenKota
  };
}

console.log('Data Wilayah API module loaded!');