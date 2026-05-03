' Windows VBScript to start Tyagi services silently
' Save as: tyagi-startup.vbs
' Right-click → "Run as administrator" or add to startup folder

Option Explicit

Dim objShell, objFSO, strProjectRoot, strBackendCmd, strFrontendCmd, intTimeout

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
strProjectRoot = objFSO.GetParentFolderName(WScript.ScriptFullName)
strProjectRoot = objFSO.GetParentFolderName(strProjectRoot)

' Check if paths exist
If Not objFSO.FolderExists(strProjectRoot & "\backend") Then
    MsgBox "Error: Backend folder not found at " & strProjectRoot & "\backend", vbCritical, "Tyagi Startup Error"
    WScript.Quit 1
End If

If Not objFSO.FolderExists(strProjectRoot & "\frontend") Then
    MsgBox "Error: Frontend folder not found at " & strProjectRoot & "\frontend", vbCritical, "Tyagi Startup Error"
    WScript.Quit 1
End If

' Check if processes are already running
On Error Resume Next
If IsProcessRunning("go.exe") Then
    ' Backend already running, don't start it again
    WScript.Echo "Backend is already running"
Else
    ' Start backend (hidden window)
    strBackendCmd = "cmd /c cd /d """ & strProjectRoot & "\backend"" && go run main.go"
    objShell.Run strBackendCmd, 0, False
End If

' Wait a bit for backend to start
WScript.Sleep 3000

' Start frontend (hidden window)
strFrontendCmd = "cmd /c cd /d """ & strProjectRoot & "\frontend"" && npm run dev"
objShell.Run strFrontendCmd, 0, False

' Log startup
On Error Resume Next
Dim logFile, objLogFile
logFile = objShell.ExpandEnvironmentStrings("%USERPROFILE%") & "\AppData\Local\Temp\tyagi-startup.log"
Set objLogFile = objFSO.CreateTextFile(logFile, True)
objLogFile.WriteLine "Tyagi startup initiated at: " & Now
objLogFile.WriteLine "Backend: " & strProjectRoot & "\backend"
objLogFile.WriteLine "Frontend: " & strProjectRoot & "\frontend"
objLogFile.Close
Set objLogFile = Nothing

On Error Goto 0

' Function to check if a process is running
Function IsProcessRunning(processName)
    Dim objWMIService, colProcesses, objProcess, bFound
    
    bFound = False
    Set objWMIService = GetObject("winmgmts:")
    Set colProcesses = objWMIService.ExecQuery("Select * from Win32_Process where Name = '" & processName & "'")
    
    If colProcesses.Count > 0 Then
        bFound = True
    End If
    
    IsProcessRunning = bFound
End Function
