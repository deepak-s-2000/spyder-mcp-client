; Custom NSIS script to add SpyderMCP CLI to system PATH
; This runs during installation

!macro customInstall
  ; Add CLI directory to system PATH
  DetailPrint "Adding SpyderMCP CLI to system PATH..."

  ; Get the installation directory
  StrCpy $0 "$INSTDIR\resources\cli"

  ; Read current PATH
  ReadRegStr $1 HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path"

  ; Check if already in PATH
  ${StrContains} $2 "$0" "$1"
  StrCmp $2 "" 0 skip_path_add

  ; Add to PATH
  StrCpy $1 "$1;$0"
  WriteRegExpandStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path" "$1"

  ; Broadcast environment change
  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000

  DetailPrint "SpyderMCP CLI added to PATH: $0"
  Goto path_added

  skip_path_add:
    DetailPrint "SpyderMCP CLI already in PATH"

  path_added:
!macroend

!macro customUnInstall
  ; Remove CLI directory from system PATH
  DetailPrint "Removing SpyderMCP CLI from system PATH..."

  ; Get the installation directory
  StrCpy $0 "$INSTDIR\resources\cli"

  ; Read current PATH
  ReadRegStr $1 HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path"

  ; Remove from PATH
  ${StrRep} $2 "$1" ";$0" ""
  ${StrRep} $3 "$2" "$0;" ""
  ${StrRep} $4 "$3" "$0" ""

  WriteRegExpandStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path" "$4"

  ; Broadcast environment change
  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000

  DetailPrint "SpyderMCP CLI removed from PATH"
!macroend
