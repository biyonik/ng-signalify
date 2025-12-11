const fs = require('fs');
const path = require('path');

// Hedef: ng-package.json'daki "dest" klasöründeki package.json
// Sizin ayarınızda "dest": "dist" olduğu için yol: ../dist/package.json
const distPackageJsonPath = path.join(__dirname, '../dist/package.json');

console.log('🔄 Post-build: CSS exports ayarları enjekte ediliyor...');

try {
    if (!fs.existsSync(distPackageJsonPath)) {
        throw new Error(`Dosya bulunamadı: ${distPackageJsonPath}`);
    }

    const pkg = JSON.parse(fs.readFileSync(distPackageJsonPath, 'utf8'));

    // Exports alanını güncelle
    pkg.exports = pkg.exports || {};

    // CSS dosyasını dışarı aç
    pkg.exports['./ng-signalify.css'] = {
        default: './ng-signalify.css'
    };

    // Varsa style alanını da güncelle (Eski araçlar için)
    pkg.style = './ng-signalify.css';

    fs.writeFileSync(distPackageJsonPath, JSON.stringify(pkg, null, 2));
    console.log('✅ Post-build: Başarılı! ng-signalify.css artık erişilebilir.');

} catch (error) {
    console.error('❌ Post-build Hatası:', error.message);
    process.exit(1);
}