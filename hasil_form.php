<!-- hasil_form.php -->
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Detail Data - Ngopag Bareng</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body>

<nav class="navbar navbar-dark bg-primary">
  <div class="container">
    <a class="navbar-brand" href="index.php">Ngopag Bareng</a>
  </div>
</nav>

<div class="container py-5">
  <div class="card shadow">
    <div class="card-header bg-primary text-white">
      <h3><i class="fas fa-user me-2"></i>Data Pengguna</h3>
    </div>
    <div class="card-body">
      <?php
      $foto_path = '';
      if (isset($_FILES['file']) && $_FILES['file']['error'] == 0) {
          $upload_dir = 'uploads/';
          if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);
          
          $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
          if (!in_array($_FILES['file']['type'], $allowed_types)) {
              die("<div class='alert alert-danger'>Hanya file gambar (JPG/PNG/GIF) yang diizinkan!</div>");
          }
          
          if ($_FILES['file']['size'] > 5 * 1024 * 1024) {
              die("<div class='alert alert-danger'>Ukuran file terlalu besar! Maksimal 5MB.</div>");
          }
          
          $file_name = uniqid() . '_' . basename($_FILES['file']['name']);
          $foto_path = $upload_dir . $file_name;
          
          if (!move_uploaded_file($_FILES['file']['tmp_name'], $foto_path)) {
              echo "<div class='alert alert-danger'>Gagal upload foto.</div>";
          }
      }
      ?>

      <div class="row">
        <?php if ($foto_path): ?>
        <div class="col-md-3 text-center mb-3">
          <img src="<?= htmlspecialchars($foto_path) ?>" class="img-fluid rounded" alt="Foto">
        </div>
        <?php endif; ?>
        
        <div class="col-md-9">
          <table class="table table-borderless">
            <tr>
              <td><strong>Nama:</strong></td>
              <td><?= htmlspecialchars($_POST['nama'] ?? '-') ?></td>
            </tr>
            <tr>
              <td><strong>Umur:</strong></td>
              <td><?= htmlspecialchars($_POST['umur'] ?? '-') ?> tahun</td>
            </tr>
            <tr>
              <td><strong>Provinsi:</strong></td>
              <td><?= htmlspecialchars($_POST['provinsi'] ?? '-') ?></td>
            </tr>
            <tr>
              <td><strong>Kota:</strong></td>
              <td><?= htmlspecialchars($_POST['kota'] ?? '-') ?></td>
            </tr>
            <tr>
              <td><strong>Jenis Kelamin:</strong></td>
              <td><?= htmlspecialchars($_POST['jk'] ?? '-') ?></td>
            </tr>
            <tr>
              <td><strong>Hobi:</strong></td>
              <td>
                <?php
                $hobi = $_POST['hobi'] ?? [];
                echo !empty($hobi) ? implode(', ', array_map('htmlspecialchars', $hobi)) : '-';
                ?>
              </td>
            </tr>
            <tr>
              <td><strong>Pesan:</strong></td>
              <td><?= htmlspecialchars($_POST['pesan'] ?? '-') ?></td>
            </tr>
          </table>
        </div>
      </div>

      <div class="mt-4">
        <a href="index.php" class="btn btn-primary">
          <i class="fas fa-arrow-left me-2"></i>Kembali ke Form
        </a>
        <button onclick="window.print()" class="btn btn-outline-secondary">
          <i class="fas fa-print me-2"></i>Cetak
        </button>
      </div>
    </div>
  </div>
</div>

</body>
</html>