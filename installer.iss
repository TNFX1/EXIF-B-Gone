[Setup]
AppName=EXIF-B-Gone
AppVersion=1.2.0
DefaultDirName={autopf}\EXIF-B-Gone
DefaultGroupName=EXIF-B-Gone
UninstallDisplayIcon={app}\icon.ico
SetupIconFile=icon.ico
WizardStyle=modern
Compression=lzma2
SolidCompression=yes
OutputDir=dist
OutputBaseFilename=EXIF-B-Gone-Setup-x64

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "build_dir\nwjs-v0.83.0-win-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "icon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "icon.png"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\EXIF-B-Gone"; Filename: "{app}\EXIF-B-Gone.exe"; IconFilename: "{app}\icon.ico"; IconIndex: 0
Name: "{autodesktop}\EXIF-B-Gone"; Filename: "{app}\EXIF-B-Gone.exe"; IconFilename: "{app}\icon.ico"; IconIndex: 0; Tasks: desktopicon

[Run]
Filename: "{app}\EXIF-B-Gone.exe"; Description: "{cm:LaunchProgram,EXIF-B-Gone}"; Flags: nowait postinstall skipifsilent