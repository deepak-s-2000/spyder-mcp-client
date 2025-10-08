!macro customInstall
  ; Add the CLI directory to system PATH
  DetailPrint "Adding SpyderMCP CLI to system PATH..."

  ; Read the current system PATH
  ReadRegStr $0 HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path"

  ; Simple check - if PATH doesn't contain our directory, add it
  ; We'll just append it; NSIS StrContains is complex, so we'll add if not exactly found
  ${StrContains} $1 "$INSTDIR\resources\cli" "$0"
  StrCmp $1 "" add_to_path skip_path_add

  add_to_path:
    ; Not in PATH, so add it
    StrCpy $0 "$0;$INSTDIR\resources\cli"
    WriteRegExpandStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path" "$0"
    ; Notify system of environment change
    SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000
    DetailPrint "SpyderMCP CLI added to PATH successfully"
    Goto path_done

  skip_path_add:
    DetailPrint "SpyderMCP CLI already in PATH"

  path_done:
!macroend

!macro customUnInstall
  ; Remove CLI directory from system PATH
  DetailPrint "Removing SpyderMCP CLI from system PATH..."

  ReadRegStr $0 HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path"

  ; Use StrRep to remove our path (all variations)
  ${StrRep} $0 "$0" ";$INSTDIR\resources\cli" ""
  ${StrRep} $0 "$0" "$INSTDIR\resources\cli;" ""
  ${StrRep} $0 "$0" "$INSTDIR\resources\cli" ""

  WriteRegExpandStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path" "$0"
  SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000
  DetailPrint "SpyderMCP CLI removed from PATH"
!macroend
