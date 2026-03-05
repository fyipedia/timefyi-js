Output demo.gif
Set FontSize 14
Set Width 920
Set Height 580
Set Shell "zsh"
Set Theme "Catppuccin Mocha"
Set TypingSpeed 30ms
Set Padding 20

Type "node"
Enter
Sleep 1s

Type "const { getCurrentTime, getTimeDifference, getBusinessHoursOverlap } = await import('timefyi')"
Enter
Sleep 1.5s

Type "getCurrentTime('Asia/Seoul')"
Enter
Sleep 2s

Type "getTimeDifference('Asia/Seoul', 'America/New_York')"
Enter
Sleep 2.5s

Type "getBusinessHoursOverlap(['America/New_York', 'Europe/London'])"
Enter
Sleep 2.5s

Type ".exit"
Enter
Sleep 1s
