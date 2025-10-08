; Custom NSIS script to add SpyderMCP CLI to system PATH
; This runs during installation

!macro customInstall
  ; Add CLI directory to system PATH
  DetailPrint "Adding SpyderMCP CLI to system PATH..."

  ; Use EnvVarUpdate plugin (built into electron-builder's NSIS)
  ${EnvVarUpdate} $0 "PATH" "A" "HKLM" "$INSTDIR\resources\cli"

  DetailPrint "SpyderMCP CLI added to PATH"
!macroend

!macro customUnInstall
  ; Remove CLI directory from system PATH
  DetailPrint "Removing SpyderMCP CLI from system PATH..."

  ; Use EnvVarUpdate plugin to remove from PATH
  ${EnvVarUpdate} $0 "PATH" "R" "HKLM" "$INSTDIR\resources\cli"

  DetailPrint "SpyderMCP CLI removed from PATH"
!macroend
