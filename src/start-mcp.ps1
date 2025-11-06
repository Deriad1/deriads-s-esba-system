# Use existing API_KEY env var or securely prompt for it (hidden).
# Run this from project root: .\start-mcp.ps1

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Error "npx not found. Install Node.js or ensure npx is on PATH."
    exit 1
}

if (-not $env:API_KEY -or $env:API_KEY -eq "") {
    Write-Host "Enter TestSprite API key (input hidden):"
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
    Write-Host "API key set for this session."
}
else {
    Write-Host "Using API_KEY from environment."
}

Write-Host "Starting TestSprite MCP..."
& npx --yes @testsprite/testsprite-mcp@latest testsprite-mcp-plugin