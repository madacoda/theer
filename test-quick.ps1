
$body = @{
    email = "me@madacoda.dev"
    password = "Password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "Login Successful!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5 | Write-Host
} catch {
    Write-Host "Login Failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
