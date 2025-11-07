# TestSprite MCP Launcher
# Run this from project root: .\start-testsprite.ps1

if (-not $env:API_KEY -or $env:API_KEY -eq "") {
    Write-Host "Enter TestSprite API key (input will be hidden):" -ForegroundColor Cyan
    $secure = Read-Host -AsSecureString
    if ($secure.Length -eq 0) {
        Write-Error "No API key provided. Exiting."
        exit 1
    }
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        $env:API_KEY = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    }
    finally {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
    Write-Host "API key set for this session." -ForegroundColor Green
}
else {
    Write-Host "Using API_KEY from environment." -ForegroundColor Green
}

Write-Host "`nStarting TestSprite MCP..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Gray

# Run TestSprite
testsprite-mcp-plugin
