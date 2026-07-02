$dest = "non_used"
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$files = @(
    "Level1Karpat.js",
    "Level2Europa.js",
    "Level3Afrika.js",
    "Level4Asia.js",
    "App_old.js",
    "App_v2.js",
    "App 0701.js",
    "filelist.txt",
    "dinosaurs_nhm.json",
    "application-46757ae1-5370-4e26-8d91-90603dc24313.aab"
)

$folders = @(
    "services",
    "Who-Wants-to-Be-a-Millionaire"
)

foreach ($f in $files) {
    if (Test-Path $f) {
        Move-Item -Path $f -Destination $dest
        Write-Host "Moved: $f"
    } else {
        Write-Host "Not found: $f"
    }
}

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Move-Item -Path $folder -Destination $dest
        Write-Host "Moved folder: $folder"
    } else {
        Write-Host "Not found: $folder"
    }
}

Write-Host "Done."
