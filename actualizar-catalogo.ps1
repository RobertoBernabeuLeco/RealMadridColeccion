param(
  [string]$AppDir = $PSScriptRoot
)

$root = Resolve-Path -LiteralPath $AppDir
$assetsRoot = Join-Path $root "assets\Camisetas Real Madrid"
$outFile = Join-Path $root "catalog.generated.js"

if (-not (Test-Path -LiteralPath $assetsRoot)) {
  Write-Error "No encuentro la carpeta de imagenes: $assetsRoot"
  exit 1
}

function Get-KitKind {
  param([string]$Name)

  $lower = $Name.ToLowerInvariant()
  if ($lower -match "tercera") { return "third" }
  if ($lower -match "visitante") { return "away" }
  if ($lower -match "local") { return "home" }
  return "other"
}

function Get-Title {
  param([string]$Name)

  $base = [System.IO.Path]::GetFileNameWithoutExtension($Name)
  $words = $base -replace "-", " "
  return (Get-Culture).TextInfo.ToTitleCase($words)
}

function Get-PrimaryScore {
  param(
    [object]$Image,
    [string]$Season,
    [string]$Kind
  )

  $file = $Image.file.ToLowerInvariant()
  $score = 0

  if ($Kind -eq "home" -and $file -eq "camiseta-local-real-madrid-$Season.jpg") { $score += 1000 }
  if ($Kind -eq "away" -and $file -eq "camiseta-visitante-real-madrid-$Season.jpg") { $score += 1000 }
  if ($Kind -eq "third" -and $file -eq "tercera-camiseta-real-madrid-$Season.jpg") { $score += 1000 }

  if ($file -match "liga-de-campeones|champions|copa|supercopa|intercontinental|europeo|especial|pretemporada|v2|v3|local-2|visitante-2") {
    $score -= 20
  }

  $score -= $file.Length / 1000
  return $score
}

$seasons = Get-ChildItem -LiteralPath $assetsRoot -Directory |
  Sort-Object Name |
  ForEach-Object {
    $season = $_.Name
    $files = Get-ChildItem -LiteralPath $_.FullName -File -Include *.jpg,*.jpeg,*.png,*.webp |
      Sort-Object Name |
      ForEach-Object {
        $relative = $_.FullName.Substring($root.Path.Length + 1).Replace("\", "/")
        [PSCustomObject]@{
          file = $_.Name
          src = $relative
          title = Get-Title $_.Name
          kind = Get-KitKind $_.Name
        }
      }

    $images = [ordered]@{}
    foreach ($kind in @("home", "away", "third")) {
      $candidate = $files |
        Where-Object { $_.kind -eq $kind } |
        Sort-Object @{ Expression = { Get-PrimaryScore $_ $season $kind }; Descending = $true }, file |
        Select-Object -First 1

      if ($candidate) {
        $images[$kind] = $candidate
      } else {
        $images[$kind] = $null
      }
    }

    [PSCustomObject]@{
      season = $season
      images = $images
      gallery = $files
    }
  }

$json = $seasons | ConvertTo-Json -Depth 8
$content = "window.RM_CATALOG = $json;`n"
Set-Content -LiteralPath $outFile -Value $content -Encoding UTF8

Write-Host "Catalogo actualizado:" $outFile
Write-Host "Temporadas:" ($seasons | Measure-Object).Count
Write-Host "Imagenes:" (Get-ChildItem -LiteralPath $assetsRoot -Recurse -File | Measure-Object).Count
