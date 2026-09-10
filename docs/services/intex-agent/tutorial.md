# Intex Agent Tutorial

## Create A Note

Send a WhatsApp text message such as:

```text
Save a note: review the Q4 report before Friday
```

Review the proposed note and confirm using the WhatsApp button. Intex then calls `create_note` and replies with the result.

## Create A Calendar Event

Use complete event details:

```text
Schedule dentist appointment next Tuesday from 15:00 to 16:00
```

If the title, date, or start is missing, Intex asks a clarification. An explicit duration determines the end; otherwise a missing end uses a visible 60-minute default in the final confirmation. Confirm the complete event before it is created.

## Create A Code Task

Use a message like:

```text
Create a code task to fix the login redirect on Safari
```

The created task defaults to planning mode so the design can be reviewed before implementation.

## Save A Bookmark

Send a bare URL or ask to save a link:

```text
https://example.com/article
```

Intex routes the message to `create_link`. Words inside the URL do not count as commands for another tool.

## Query And Update Your Calendar

Ask `What is on my calendar tomorrow?` or `How many meetings did I have last month?`. To change an event, ask `Move tomorrow’s dentist appointment to 16:00` or `Add pat@example.com to tomorrow’s planning meeting`. Intex looks up the event, asks about ambiguous targets, then shows the complete proposed change for confirmation. Review every event in a multi-event update; each update executes independently.

## Personal Settings

Open Intex settings to manage individual saved instructions and inspect their versions. Choose an Intex model if the selector is available for your account. You can also ask `Show my Intex preferences` in WhatsApp. External Save settings include a connection test before you send content to the configured destination.

## Continue A Session

After Intex replies, send a follow-up in the same WhatsApp conversation. The same session stays open, so clarification answers and short follow-ups are processed with the previous timeline. To force a fresh session, send:

```text
new session
```

## Unsupported Requests

Requests must match a supported creation, calendar query/update, or preference capability to receive tool access. For example, asking how many notes were created last month returns an unsupported reply because note search is outside the supported read tools.
