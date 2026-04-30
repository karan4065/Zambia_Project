Set WshShell = CreateObject("WScript.Shell")

' Start Backend
WshShell.CurrentDirectory = "D:\zambianew\Zambia_Project\backend"
WshShell.Run "npm start", 0, False

' Start Frontend
WshShell.CurrentDirectory = "D:\zambianew\Zambia_Project\frontend"
WshShell.Run "npm run dev", 0, False