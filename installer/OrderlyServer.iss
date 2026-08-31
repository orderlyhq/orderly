; ==========================================================
; ORDERLY - INSTALADOR PRINCIPAL
; ==========================================================

#define MyAppName "Orderly"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Orderly"
#define MyAppExeName "node.exe"
#define MyServiceName "OrderlyServer"

[Setup]

AppId={{8F5E3B7C-4A21-4C8D-B9F2-6E71A93D2054}}

AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}

DefaultDirName={autopf}\Orderly
DefaultGroupName=Orderly

OutputDir=output
OutputBaseFilename=OrderlySetup

Compression=lzma2
SolidCompression=yes

ArchitecturesInstallIn64BitMode=x64
ArchitecturesAllowed=x64

PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog

DisableProgramGroupPage=yes
DisableDirPage=no

WizardStyle=modern

Uninstallable=yes
CreateUninstallRegKey=yes

UninstallDisplayName=Orderly
UninstallDisplayIcon={app}\Orderly.exe

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

; ==========================================================
; ARQUIVOS
; ==========================================================

[Files]

; ----------------------------------------------------------
; NODE.JS
; ----------------------------------------------------------

Source: "payload\node\node.exe"; \
    DestDir: "{app}\node"; \
    Flags: ignoreversion

; ----------------------------------------------------------
; NSSM
; ----------------------------------------------------------

Source: "payload\nssm\nssm.exe"; \
    DestDir: "{app}\nssm"; \
    Flags: ignoreversion

; ----------------------------------------------------------
; SERVIDOR ORDERLY
; ----------------------------------------------------------

Source: "..\server\bot.js"; \
    DestDir: "{app}\server"; \
    Flags: ignoreversion

Source: "..\server\printer.js"; \
    DestDir: "{app}\server"; \
    Flags: ignoreversion

Source: "..\server\raw-print.ps1"; \
    DestDir: "{app}\server"; \
    Flags: ignoreversion

Source: "..\server\package.json"; \
    DestDir: "{app}\server"; \
    Flags: ignoreversion

Source: "..\server\package-lock.json"; \
    DestDir: "{app}\server"; \
    Flags: ignoreversion

; ----------------------------------------------------------
; BEE DELIVERY
; ----------------------------------------------------------

Source: "..\server\bee\*"; \
    DestDir: "{app}\server\bee"; \
    Flags: ignoreversion recursesubdirs createallsubdirs

; ----------------------------------------------------------
; CONFIG
; ----------------------------------------------------------

Source: "..\server\config\*"; \
    DestDir: "{app}\server\config"; \
    Flags: ignoreversion recursesubdirs createallsubdirs

; ----------------------------------------------------------
; MIDDLEWARE
; ----------------------------------------------------------

Source: "..\server\middleware\*"; \
    DestDir: "{app}\server\middleware"; \
    Flags: ignoreversion recursesubdirs createallsubdirs

; ----------------------------------------------------------
; ROUTES
; ----------------------------------------------------------

Source: "..\server\routes\*"; \
    DestDir: "{app}\server\routes"; \
    Flags: ignoreversion recursesubdirs createallsubdirs

; ----------------------------------------------------------
; WHATSAPP
; ----------------------------------------------------------

Source: "..\server\whatsapp\*"; \
    DestDir: "{app}\server\whatsapp"; \
    Flags: ignoreversion recursesubdirs createallsubdirs

; ----------------------------------------------------------
; NODE_MODULES
; ----------------------------------------------------------

Source: "..\server\node_modules\*"; \
    DestDir: "{app}\server\node_modules"; \
    Flags: ignoreversion recursesubdirs createallsubdirs

; ----------------------------------------------------------
; CHROMIUM / PUPPETEER
; ----------------------------------------------------------

Source: "..\server\.puppeteer\*"; \
    DestDir: "{app}\server\.puppeteer"; \
    Flags: ignoreversion recursesubdirs createallsubdirs

Source: "..\server\scripts\*"; \
    DestDir: "{app}\server\scripts"; \
    Flags: ignoreversion recursesubdirs createallsubdirs

; ----------------------------------------------------------
; SCRIPTS AUXILIARES
; ----------------------------------------------------------

Source: "install-service.cmd"; \
    DestDir: "{app}"; \
    Flags: ignoreversion

Source: "uninstall-service.cmd"; \
    DestDir: "{app}"; \
    Flags: ignoreversion

; ==========================================================
; DIRETÓRIOS
; ==========================================================

[Dirs]

Name: "{app}"
Name: "{app}\server"
Name: "{app}\node"
Name: "{app}\nssm"
Name: "{app}\server\.puppeteer"

Name: "{commonappdata}\Orderly"
Name: "{commonappdata}\Orderly\logs"
Name: "{commonappdata}\Orderly\whatsapp"

; ==========================================================
; ATALHOS
; ==========================================================

[Icons]

Name: "{group}\Orderly"; \
    Filename: "{app}\Orderly.exe"; \
    WorkingDir: "{app}"

Name: "{group}\Orderly - Pasta do servidor"; \
    Filename: "{app}\server"

Name: "{group}\Orderly - Logs"; \
    Filename: "{commonappdata}\Orderly\logs"

; ==========================================================
; EXECUÇÃO
; ==========================================================

[Run]

; Cria e configura o serviço Windows
Filename: "{app}\install-service.cmd"; \
    Parameters: ""; \
    WorkingDir: "{app}"; \
    Flags: runhidden waituntilterminated

; Abre o navegador na página inicial do admin após instalação
Filename: "http://localhost:3001/health"; \
    Flags: shellexec postinstall skipifsilent

; ==========================================================
; DESINSTALAÇÃO
; ==========================================================

[UninstallRun]

Filename: "{app}\uninstall-service.cmd"; \
    Parameters: ""; \
    WorkingDir: "{app}"; \
    Flags: runhidden waituntilterminated

; ==========================================================
; CÓDIGO
; ==========================================================

[Code]

function PrepareToInstall(
  var NeedsRestart: Boolean
): String;
begin
  Result := '';

  NeedsRestart := False;
end;

function InitializeSetup(): Boolean;
begin
  Result := True;
end;

procedure CurStepChanged(
  CurStep: TSetupStep
);
begin

  if CurStep = ssInstall then
  begin
    WizardForm.StatusLabel.Caption :=
      'Instalando Orderly...';
  end;

end;