!macro customInstall
  ; Add the CLI directory to system PATH
  DetailPrint "Adding SpyderMCP CLI to system PATH..."

  ; Read the current system PATH
  ReadRegStr $0 HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path"

  ; Check if already in PATH
  Push "$0"
  Push "$INSTDIR\resources\cli"
  Call StrStr
  Pop $1
  StrCmp $1 "" 0 skip_path_add

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

  ; Simple string replacement to remove our path
  Push "$0"
  Push ";$INSTDIR\resources\cli"
  Push ""
  Call un.StrRep
  Pop $0

  Push "$0"
  Push "$INSTDIR\resources\cli;"
  Push ""
  Call un.StrRep
  Pop $0

  Push "$0"
  Push "$INSTDIR\resources\cli"
  Push ""
  Call un.StrRep
  Pop $0

  WriteRegExpandStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path" "$0"
  SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000
  DetailPrint "SpyderMCP CLI removed from PATH"
!macroend

; Helper function to find substring
Function StrStr
  Exch $R1 ; substring
  Exch
  Exch $R2 ; string
  Push $R3
  Push $R4
  Push $R5
  StrLen $R3 $R1
  StrCpy $R4 0
  loop:
    StrCpy $R5 $R2 $R3 $R4
    StrCmp $R5 $R1 done
    StrCmp $R5 "" done
    IntOp $R4 $R4 + 1
    Goto loop
  done:
  StrCpy $R1 $R5
  Pop $R5
  Pop $R4
  Pop $R3
  Pop $R2
  Exch $R1
FunctionEnd

; String replace function
Function StrRep
  Exch $R4 ; new string
  Exch
  Exch $R3 ; old string
  Exch 2
  Exch $R1 ; string
  Push $R2 ; counter
  Push $R5 ; temp str
  Push $R6 ; output
  Push $R7 ; temp str len

  StrCpy $R2 0
  StrLen $R7 $R3
  StrCpy $R6 ""

  loop_rep:
    StrCpy $R5 $R1 $R7 $R2
    StrCmp $R5 "" done_rep
    StrCmp $R5 $R3 0 +3
      StrCpy $R6 "$R6$R4"
      IntOp $R2 $R2 + $R7
      Goto loop_rep
    StrCpy $R5 $R1 1 $R2
    StrCpy $R6 "$R6$R5"
    IntOp $R2 $R2 + 1
    Goto loop_rep

  done_rep:
    StrCpy $R1 $R6
    Pop $R7
    Pop $R6
    Pop $R5
    Pop $R2
    Pop $R1
    Pop $R3
    Exch $R4
FunctionEnd

; Uninstaller versions
Function un.StrRep
  Exch $R4
  Exch
  Exch $R3
  Exch 2
  Exch $R1
  Push $R2
  Push $R5
  Push $R6
  Push $R7

  StrCpy $R2 0
  StrLen $R7 $R3
  StrCpy $R6 ""

  loop_rep:
    StrCpy $R5 $R1 $R7 $R2
    StrCmp $R5 "" done_rep
    StrCmp $R5 $R3 0 +3
      StrCpy $R6 "$R6$R4"
      IntOp $R2 $R2 + $R7
      Goto loop_rep
    StrCpy $R5 $R1 1 $R2
    StrCpy $R6 "$R6$R5"
    IntOp $R2 $R2 + 1
    Goto loop_rep

  done_rep:
    StrCpy $R1 $R6
    Pop $R7
    Pop $R6
    Pop $R5
    Pop $R2
    Pop $R1
    Pop $R3
    Exch $R4
FunctionEnd
