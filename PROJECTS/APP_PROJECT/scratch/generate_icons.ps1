Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\User\Downloads\FINAL-YEAR-PDD-PROJECT\FINAL-YEAR-PDD-PROJECT-main\PROJECTS\APP_PROJECT\public\logo.png"
$resDir = "c:\Users\User\Downloads\FINAL-YEAR-PDD-PROJECT\FINAL-YEAR-PDD-PROJECT-main\PROJECTS\APP_PROJECT\android\app\src\main\res"

$srcBmp = [System.Drawing.Bitmap]::new($srcPath)

function Resize-Image {
    param(
        [System.Drawing.Bitmap]$source,
        [int]$targetWidth,
        [int]$targetHeight,
        [string]$outputPath,
        [bool]$isRound = $false
    )
    $dest = [System.Drawing.Bitmap]::new($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    if ($isRound) {
        $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
        $path.AddEllipse(0, 0, $targetWidth, $targetHeight)
        $g.SetClip($path)
    }

    $g.DrawImage($source, 0, 0, $targetWidth, $targetHeight)
    $g.Dispose()
    
    # Save as PNG
    if (Test-Path $outputPath) { Remove-Item $outputPath -Force }
    $dest.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Host "Generated: $outputPath ($targetWidth x $targetHeight)"
}

function Create-AdaptiveForeground {
    param(
        [System.Drawing.Bitmap]$source,
        [int]$canvasSize,
        [string]$outputPath
    )
    $dest = [System.Drawing.Bitmap]::new($canvasSize, $canvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # Adaptive icon safe zone is 66% of the canvas centered
    $iconSize = [int]($canvasSize * 0.72)
    $offset = [int](($canvasSize - $iconSize) / 2)
    $g.DrawImage($source, $offset, $offset, $iconSize, $iconSize)
    $g.Dispose()

    if (Test-Path $outputPath) { Remove-Item $outputPath -Force }
    $dest.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Host "Generated Foreground: $outputPath ($canvasSize x $canvasSize)"
}

function Create-Splash {
    param(
        [System.Drawing.Bitmap]$source,
        [int]$width,
        [int]$height,
        [string]$outputPath
    )
    $dest = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Fill elegant dark navy background matching splash theme
    $bgColor = [System.Drawing.ColorTranslator]::FromHtml("#0f172a")
    $g.Clear($bgColor)

    # Calculate centered logo size (e.g. 35% of smaller dimension)
    $minDim = [Math]::Min($width, $height)
    $logoSize = [int]($minDim * 0.42)
    $offsetX = [int](($width - $logoSize) / 2)
    $offsetY = [int](($height - $logoSize) / 2)

    $g.DrawImage($source, $offsetX, $offsetY, $logoSize, $logoSize)
    $g.Dispose()

    if (Test-Path $outputPath) { Remove-Item $outputPath -Force }
    $dest.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Host "Generated Splash: $outputPath ($width x $height)"
}

# 1. Launcher densities
$densities = @{
    "mipmap-mdpi" = @{ icon = 48; fg = 108 }
    "mipmap-hdpi" = @{ icon = 72; fg = 162 }
    "mipmap-xhdpi" = @{ icon = 96; fg = 216 }
    "mipmap-xxhdpi" = @{ icon = 144; fg = 324 }
    "mipmap-xxxhdpi" = @{ icon = 192; fg = 432 }
}

foreach ($d in $densities.Keys) {
    $dir = Join-Path $resDir $d
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }
    
    $iconSize = $densities[$d].icon
    $fgSize = $densities[$d].fg
    
    Resize-Image -source $srcBmp -targetWidth $iconSize -targetHeight $iconSize -outputPath (Join-Path $dir "ic_launcher.png")
    Resize-Image -source $srcBmp -targetWidth $iconSize -targetHeight $iconSize -outputPath (Join-Path $dir "ic_launcher_round.png") -isRound $true
    Create-AdaptiveForeground -source $srcBmp -canvasSize $fgSize -outputPath (Join-Path $dir "ic_launcher_foreground.png")
}

# 2. Splash densities
$splashDims = @{
    "drawable" = @{ w = 480; h = 800 }
    "drawable-port-mdpi" = @{ w = 320; h = 480 }
    "drawable-port-hdpi" = @{ w = 480; h = 800 }
    "drawable-port-xhdpi" = @{ w = 720; h = 1280 }
    "drawable-port-xxhdpi" = @{ w = 960; h = 1600 }
    "drawable-port-xxxhdpi" = @{ w = 1280; h = 1920 }
    "drawable-land-mdpi" = @{ w = 480; h = 320 }
    "drawable-land-hdpi" = @{ w = 800; h = 480 }
    "drawable-land-xhdpi" = @{ w = 1280; h = 720 }
    "drawable-land-xxhdpi" = @{ w = 1600; h = 960 }
    "drawable-land-xxxhdpi" = @{ w = 1920; h = 1280 }
}

foreach ($s in $splashDims.Keys) {
    $dir = Join-Path $resDir $s
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }
    Create-Splash -source $srcBmp -width $splashDims[$s].w -height $splashDims[$s].h -outputPath (Join-Path $dir "splash.png")
}

$srcBmp.Dispose()
Write-Host "All NyayaMitra icons and splash screens successfully generated!"
