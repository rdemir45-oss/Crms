// Otomatik kapanan alert'ler
document.addEventListener('DOMContentLoaded', () => {
  const alerts = document.querySelectorAll('.alert-success, .alert-info');
  alerts.forEach(alert => {
    setTimeout(() => {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      if (bsAlert) bsAlert.close();
    }, 4000);
  });
});
