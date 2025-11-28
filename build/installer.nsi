; Ninja Toolkit v11 - NSIS Installer Configuration
; Silent install support (/S), GPO/Intune compatible, auto-start hooks

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"

; Product Information
!define PRODUCT_NAME "Ninja Toolkit"
!define PRODUCT_VERSION "11.0.0"
!define PRODUCT_PUBLISHER "Ninja Toolkit Team"
!define PRODUCT_WEB_SITE "https://github.com/ninja-toolkit"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\ninja-toolkit.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

; GPO/Intune Registry Keys
!define GPO_POLICIES_KEY "Software\Policies\NinjaToolkit"
!define INTUNE_DETECTION_KEY "Software\NinjaToolkit\Detection"

; MUI Settings
!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"
!define MUI_WELCOMEFINISHPAGE_BITMAP "${NSISDIR}\Contrib\Graphics\Wizard\win.bmp"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_RIGHT

; Welcome page
!insertmacro MUI_PAGE_WELCOME
; License page (optional)
; !insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
; Directory page
!insertmacro MUI_PAGE_DIRECTORY
; Start menu page
Var ICONS_GROUP
!define MUI_STARTMENUPAGE_REGISTRY_ROOT "${PRODUCT_UNINST_ROOT_KEY}"
!define MUI_STARTMENUPAGE_REGISTRY_KEY "${PRODUCT_UNINST_KEY}"
!define MUI_STARTMENUPAGE_REGISTRY_VALUENAME "StartMenuGroup"
!define MUI_STARTMENUPAGE_DEFAULTFOLDER "${PRODUCT_NAME}"
!insertmacro MUI_PAGE_STARTMENU Application $ICONS_GROUP
; Instfiles page
!insertmacro MUI_PAGE_INSTFILES
; Finish page with auto-start option
!define MUI_FINISHPAGE_RUN "$INSTDIR\ninja-toolkit.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch ${PRODUCT_NAME}"
!define MUI_FINISHPAGE_SHOWREADME ""
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Add to Windows startup"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION AddToStartup
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Language
!insertmacro MUI_LANGUAGE "English"

; Installer attributes
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "NinjaToolkit-Setup-${PRODUCT_VERSION}.exe"
InstallDir "$PROGRAMFILES64\${PRODUCT_NAME}"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUninstDetails show

; Silent install detection
Var SILENT_MODE
Var AUTO_START

Function .onInit
  ; Check for silent mode (/S flag)
  ${GetParameters} $0
  ${GetOptions} $0 "/S" $1
  IfErrors 0 +3
    StrCpy $SILENT_MODE "0"
    Goto +2
  StrCpy $SILENT_MODE "1"

  ; Check for auto-start flag (/AUTOSTART)
  ${GetOptions} $0 "/AUTOSTART" $1
  IfErrors 0 +3
    StrCpy $AUTO_START "0"
    Goto +2
  StrCpy $AUTO_START "1"

  ; Check for admin rights
  UserInfo::GetAccountType
  Pop $0
  ${If} $0 != "admin"
    MessageBox MB_ICONSTOP "Administrator rights required for installation."
    SetErrorLevel 740
    Quit
  ${EndIf}
FunctionEnd

; Auto-start function
Function AddToStartup
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCT_NAME}" "$INSTDIR\ninja-toolkit.exe --minimized"
FunctionEnd

; Main install section
Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite on

  ; Copy all application files
  File /r "app\*.*"

  ; Create shortcuts
  !insertmacro MUI_STARTMENU_WRITE_BEGIN Application
  CreateDirectory "$SMPROGRAMS\$ICONS_GROUP"
  CreateShortCut "$SMPROGRAMS\$ICONS_GROUP\${PRODUCT_NAME}.lnk" "$INSTDIR\ninja-toolkit.exe"
  CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\ninja-toolkit.exe"
  !insertmacro MUI_STARTMENU_WRITE_END

  ; Write GPO/Intune compatible registry keys
  WriteRegStr HKLM "${GPO_POLICIES_KEY}" "InstallPath" "$INSTDIR"
  WriteRegStr HKLM "${GPO_POLICIES_KEY}" "Version" "${PRODUCT_VERSION}"
  WriteRegDWORD HKLM "${GPO_POLICIES_KEY}" "Installed" 1
  WriteRegStr HKLM "${GPO_POLICIES_KEY}" "InstallDate" "$NOW"

  ; Intune detection keys
  WriteRegStr HKLM "${INTUNE_DETECTION_KEY}" "ProductVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKLM "${INTUNE_DETECTION_KEY}" "ProductCode" "{NTK-11.0.0-GUID}"
  WriteRegDWORD HKLM "${INTUNE_DETECTION_KEY}" "DetectionMethod" 1

  ; App paths registration
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\ninja-toolkit.exe"

  ; Uninstaller registry
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\ninja-toolkit.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "NoModify" 1
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "NoRepair" 1

  ; Get installed size
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "EstimatedSize" "$0"

  ; Create uninstaller
  WriteUninstaller "$INSTDIR\uninst.exe"

  ; Handle silent mode auto-start
  ${If} $AUTO_START == "1"
    Call AddToStartup
  ${EndIf}
SectionEnd

; Post-install section - firewall rules
Section "-Post"
  ; Add firewall exception for application
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="${PRODUCT_NAME}" dir=in action=allow program="$INSTDIR\ninja-toolkit.exe" enable=yes profile=any'
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="${PRODUCT_NAME} Out" dir=out action=allow program="$INSTDIR\ninja-toolkit.exe" enable=yes profile=any'
SectionEnd

; Uninstaller section
Section Uninstall
  ; Remove firewall rules
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="${PRODUCT_NAME}"'
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="${PRODUCT_NAME} Out"'

  ; Remove auto-start
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCT_NAME}"

  ; Remove shortcuts
  !insertmacro MUI_STARTMENU_GETFOLDER Application $ICONS_GROUP
  Delete "$SMPROGRAMS\$ICONS_GROUP\${PRODUCT_NAME}.lnk"
  RMDir "$SMPROGRAMS\$ICONS_GROUP"
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"

  ; Remove files
  RMDir /r "$INSTDIR"

  ; Remove registry keys
  DeleteRegKey HKLM "${GPO_POLICIES_KEY}"
  DeleteRegKey HKLM "${INTUNE_DETECTION_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"

  SetAutoClose true
SectionEnd

; Version info
VIProductVersion "${PRODUCT_VERSION}.0"
VIAddVersionKey "ProductName" "${PRODUCT_NAME}"
VIAddVersionKey "CompanyName" "${PRODUCT_PUBLISHER}"
VIAddVersionKey "FileDescription" "Ninja Toolkit Installer"
VIAddVersionKey "FileVersion" "${PRODUCT_VERSION}"
VIAddVersionKey "ProductVersion" "${PRODUCT_VERSION}"
VIAddVersionKey "LegalCopyright" "Copyright 2025 ${PRODUCT_PUBLISHER}"
