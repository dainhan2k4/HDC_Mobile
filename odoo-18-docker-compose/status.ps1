Write-Host "=== Odoo Development Environment Status ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Container Status:" -ForegroundColor Yellow
docker-compose ps
Write-Host ""

Write-Host "2. Mount Volumes:" -ForegroundColor Yellow
docker-compose exec odoo18 ls -la /mnt/extra-addons
Write-Host ""

Write-Host "3. Odoo Configuration:" -ForegroundColor Yellow
docker-compose exec odoo18 cat /etc/odoo/odoo.conf | Select-String -Pattern "(dev_mode|addons_path)"
Write-Host ""

Write-Host "4. Recent Logs:" -ForegroundColor Yellow
docker-compose logs --tail=10 odoo18
Write-Host ""

Write-Host "=== Access URLs ===" -ForegroundColor Green
Write-Host "Odoo Web Interface: http://localhost:10018" -ForegroundColor White
Write-Host "Live Chat: http://localhost:20018" -ForegroundColor White
Write-Host "Database Manager: http://localhost:10018/web/database/manager" -ForegroundColor White 