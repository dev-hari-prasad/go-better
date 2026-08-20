# Database Schema

| Table | Description |
| --- | --- |
| `users` | Stores user accounts, login details, roles, and notification settings. |
| `repository` | Stores connected repositories, their owners, and review preferences. |
| `pull_requests` | Stores pull request details, branches, commits, and review status. |
| `review` | Tracks each review run, including its status, result, and errors. |
| `aiConversation` | Groups a user's AI messages into a conversation with basic metadata. |
| `aiMessages` | Stores AI inputs, outputs, token usage, costs, and message metadata. |
