Write-Host "Restarting Odoo container..." -ForegroundColor Green
docker-compose restart odoo18

Write-Host "Waiting for Odoo to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "Odoo container restarted successfully!" -ForegroundColor Green
Write-Host "You can access Odoo at: http://localhost:10018" -ForegroundColor Cyan 