[Setup]
AppName=EXIF-B-Gone
AppVersion=1.0.12
DefaultDirName={autopf}\EXIF-B-Gone
DefaultGroupName=EXIF-B-Gone
UninstallDisplayIcon={app}\EXIF-B-Gone.exe
Compression=lzma2
SolidCompression=yes
OutputDir=dist
OutputBaseFilename=EXIF-B-Gone-Setup-x64
SetupIconFile=icon.ico

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
; Derlenen tüm NW.js / EXE çıktı dosyalarını kopyalar
Source: "build_dir\nwjs-v0.83.0-win-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\EXIF-B-Gone"; Filename: "{app}\EXIF-B-Gone.exe"
Name: "{autodesktop}\EXIF-B-Gone"; Filename: "{app}\EXIF-B-Gone.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\EXIF-B-Gone.exe"; Description: "{cm:LaunchProgram,EXIF-B-Gone}"; Flags: nowait postinstall skipifsilent