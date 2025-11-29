; Ninja Toolkit v11 NSIS Installer Configuration
; This file is included during NSIS build process

!macro customHeader
  !system "echo Ninja Toolkit v11 - Custom Install Script"
!macroend

!macro preInit
  ; Set default installation directory
  SetShellVarContext current
  StrCpy $INSTDIR "$LOCALAPPDATA\Programs\${PRODUCT_NAME}"
!macroend

!macro customInit
  ; Custom initialization code
!macroend

!macro customInstall
  ; Create logs directory
  CreateDirectory "$INSTDIR\logs"

  ; Create art directories if they don't exist (if not already bundled)
  CreateDirectory "$INSTDIR\resources\art"
  CreateDirectory "$INSTDIR\resources\art\images"
  CreateDirectory "$INSTDIR\resources\art\videos"
!macroend

!macro customUnInstall
  ; Clean up logs on uninstall (optional)
  RMDir /r "$INSTDIR\logs"
!macroend
