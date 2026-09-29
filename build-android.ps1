# EcoChef Android Build Script
# Baut eine Debug-APK und kopiert sie auf den Desktop

$sdk = "C:\Users\sche-\AppData\Local\Android\Sdk"
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:JAVA_HOME = "C:\Program Files\jdk-17.0.17+10"
$env:PATH = "$sdk\platform-tools;$sdk\cmdline-tools\latest\bin;$env:JAVA_HOME\bin;$env:PATH"

$projectDir = $PSScriptRoot
Set-Location $projectDir

# 1. Web-App bauen
Write-Host "1. Web-App bauen..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build fehlgeschlagen!" -ForegroundColor Red; exit 1 }

# 2. Cordova prepare (kopiert www/ in Android-Assets)
Write-Host "2. Cordova prepare..." -ForegroundColor Cyan
npx cordova prepare android 2>&1 | Select-Object -Last 3

# 3. Gradle-Heap begrenzen (Cordova setzt 2048m, zu viel fuer 16GB-Systeme mit wenig freiem RAM)
$propsFile = "$projectDir\platforms\android\gradle.properties"
"org.gradle.jvmargs=-Xmx512m`nandroid.useAndroidX=true`nandroid.enableJetifier=true" | Set-Content $propsFile
Write-Host "   Gradle heap auf 512m gesetzt." -ForegroundColor Gray

# 4. APK bauen
Write-Host "3. APK bauen..." -ForegroundColor Cyan
$gradlew = "$projectDir\platforms\android\gradlew.bat"
& $gradlew -p "$projectDir\platforms\android" cdvBuildDebug --no-daemon
if ($LASTEXITCODE -ne 0) { Write-Host "Gradle Build fehlgeschlagen!" -ForegroundColor Red; exit 1 }

# 5. APK auf Desktop kopieren
$apkSrc = "$projectDir\platforms\android\app\build\outputs\apk\debug\app-debug.apk"
$apkDst = "$env:USERPROFILE\Desktop\EcoChef-debug.apk"
Copy-Item $apkSrc $apkDst -Force
$sizeMB = [math]::Round((Get-Item $apkDst).Length / 1MB, 2)
Write-Host "`n✅ APK fertig: $apkDst ($sizeMB MB)" -ForegroundColor Green
Write-Host "   Per USB auf Gerät installieren oder per E-Mail senden." -ForegroundColor Gray
