!macro customInstall
  ; Add the CLI directory to system PATH
  DetailPrint "Adding SpyderMCP CLI to system PATH..."

  ; Read the current system PATH
  ReadRegStr $0 HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path"

  ; Always append our path (duplicate detection is complex in NSIS)
  ; Most installers just append and it works fine even if there are duplicates
  StrCpy $0 "$0;$INSTDIR\resources\cli"
  WriteRegExpandStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path" "$0"

  ; Notify system of environment change
  SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000
  DetailPrint "SpyderMCP CLI added to PATH"
!macroend

!macro customUnInstall
  ; Remove CLI directory from system PATH
  DetailPrint "Removing SpyderMCP CLI from system PATH..."

  ReadRegStr $0 HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path"

  ; Simple manual string replacement using NSIS built-in commands
  ; Try to remove ";C:\Program Files\SpyderMCP\resources\cli" pattern
  Push $0
  Push ";$INSTDIR\resources\cli"
  Push ""
  Call un.StrReplace
  Pop $0

  ; Also try to remove "C:\Program Files\SpyderMCP\resources\cli;" pattern
  Push $0
  Push "$INSTDIR\resources\cli;"
  Push ""
  Call un.StrReplace
  Pop $0

  ; Also try standalone pattern (in case it's the only entry)
  Push $0
  Push "$INSTDIR\resources\cli"
  Push ""
  Call un.StrReplace
  Pop $0

  WriteRegExpandStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path" "$0"
  SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000
  DetailPrint "SpyderMCP CLI removed from PATH"
!macroend

; Simple string replace function for uninstaller
Function un.StrReplace
  Exch $R0 ; replacement
  Exch
  Exch $R1 ; search string
  Exch 2
  Exch $R2 ; input string
  Push $R3 ; output
  Push $R4 ; temp
  Push $R5 ; len of search
  Push $R6 ; position

  StrLen $R5 $R1
  StrCpy $R3 ""
  StrCpy $R6 0

  loop:
    StrCpy $R4 $R2 $R5 $R6
    StrCmp $R4 "" done
    StrCmp $R4 $R1 found
    StrCpy $R4 $R2 1 $R6
    StrCpy $R3 "$R3$R4"
    IntOp $R6 $R6 + 1
    Goto loop

  found:
    StrCpy $R3 "$R3$R0"
    IntOp $R6 $R6 + $R5
    StrCpy $R2 $R2 "" $R6
    StrCpy $R6 0
    Goto loop

  done:
    StrCpy $R2 $R3
    Pop $R6
    Pop $R5
    Pop $R4
    Pop $R3
    Pop $R0
    Pop $R1
    Exch $R2
FunctionEnd
