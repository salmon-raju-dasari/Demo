$targetDir = "release\win-unpacked"

# Create directories if they don't exist
New-Item -ItemType Directory -Force -Path $targetDir
New-Item -ItemType Directory -Force -Path "$targetDir\dist"

# Copy dist files
Copy-Item -Path "dist\*" -Destination "$targetDir\dist" -Recurse -Force

# Copy electron files
Copy-Item -Path "electron\*" -Destination "$targetDir" -Recurse -Force

Write-Host "Files copied successfully to $targetDir"