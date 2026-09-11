param(
    [int]$Port = 8080
)

$distPath = Join-Path $PSScriptRoot "dist"
if (-not (Test-Path $distPath)) {
    $distPath = $PSScriptRoot
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".mjs"  = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".glb"  = "model/gltf-binary"
    ".gltf" = "model/gltf+json"
    ".zip"  = "application/zip"
    ".wasm" = "application/wasm"
    ".mp3"  = "audio/mpeg"
    ".ogg"  = "audio/ogg"
    ".wav"  = "audio/wav"
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    Write-Error "No se pudo iniciar en el puerto $Port. Detalle: $_"
    exit 1
}

Write-Host "Servidor iniciado en $prefix"
Write-Host "Sirviendo archivos desde: $distPath"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Headers", "*")
        $response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")

        $urlPath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath).TrimStart('/')
        
        if ($urlPath -eq "report-error") {
            $body = ""
            if ($request.HasEntityBody) {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $reader.Close()
            }
            Write-Host "=== BROWSER ERROR REPORT ==="
            Write-Host $body
            Write-Host "============================"
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        if ([string]::IsNullOrWhiteSpace($urlPath)) {
            $urlPath = "index.html"
        }

        $fullPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($distPath, $urlPath))
        if (-not $fullPath.StartsWith($distPath, [System.StringComparison]::OrdinalIgnoreCase)) {
            $response.StatusCode = 403
            Write-Host "403: $urlPath"
            $response.Close()
            continue
        }

        if (Test-Path $fullPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $response.ContentType = $contentType
            $response.StatusCode = 200

            try {
                $bytes = [System.IO.File]::ReadAllBytes($fullPath)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                Write-Host "200: $urlPath"
            } catch {
                $response.StatusCode = 500
                Write-Host "500: $urlPath ($($_.Exception.Message))"
            }
        } else {
            $response.StatusCode = 404
            $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            Write-Host "404: $urlPath"
        }
        $response.Close()
    }
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    $listener.Close()
}
