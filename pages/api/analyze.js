Visual Studio Code 1.115

Show release notes after an update

Follow us on LinkedIn, X, Bluesky | View online | 

Release date: April 8, 2026

Welcome to the 1.115 release of Visual Studio Code. This release makes your agent-native development experience even better with the introduction of the new VS Code Agents companion app!

VS Code Agents app: a new companion app optimized for agent-native development, running alongside VS Code Insiders.

Integrated browser: several improvements to make working with the integrated browser more seamless for agents.

Terminal tools: new capabilities for agents to interact with background terminals.

Happy Coding!

VS Code is rolling out gradually to all users. Use Check for Updates in VS Code to get the latest version immediately.

To try new features as soon as possible, download the nightly Insiders build, which includes the latest updates as soon as they are available.

In this update
Visual Studio Code Agents (Preview)
Integrated browser
Terminal tools improvements
Deprecated features and settings
Notable fixes
Thank you
Visual Studio Code Agents (Preview)
Visual Studio Code Agents is a new preview companion app that ships alongside VS Code Insiders, built for agent-native development.

Parallelize tasks across projects - Kick off agent sessions across multiple repos in parallel (each isolated in its own worktree), quickly switch context (with UI that adapts to your selection), and iterate on human and agentic reviews.

Monitor and review - Track session progress, view diffs inline, leave feedback for agents, and create pull requests without leaving the app.

Your customizations carry over - Custom instructions, prompt files, custom agents, MCP servers, hooks, and plugins all work in the Agents app, along with your other VS Code customizations like themes, for example.

No extra install - The app ships alongside VS Code Insiders. Launch it from your Start menu or Applications folder in the OS, or run Chat: Open Agents Application from the Command Palette.

The Agents app is a rapidly evolving preview. It's currently only available in VS Code Insiders, and we're looking forward to getting your feedback in GitHub issues.

Screenshot of the VS Code Agents app with a session and changes open.

Integrated browser
This release, we continue to further enhance the integrated browser experience and its capabilities for agents.

Browser agent tools improvements
Setting:   workbench.browser.enableChatTools

Better tool labels
When an agent invokes the browser tool, the tool calls now have a more descriptive label and a link to go directly to the target browser tab.

Old:
Screenshot of a tool call saying "Clicked element in browser".

New:
Screenshot of a tool call saying "Right-clicked header banner in Test Page", with a link to Test Page.

Long-running script support
The Run Playwright Code tool has improved support for long-running scripts. Scripts that take longer than five seconds to run (by default) now return a deferred result for the agent to poll.

Fewer duplicate tabs
Agents are now more heavily discouraged from repetitively opening browser tabs. Now, when an agent attempts to open a new tab and an available tab is already open to the same host, no new tab is opened unless an explicit flag is passed by the agent.

Pinch-to-zoom in the integrated browser (macOS)
The integrated browser now supports pinch-to-zoom on macOS. Use the trackpad pinch gesture to magnify web page content up to 3x.

Unlike the standard browser zoom (Ctrl+= / Ctrl+-), pinch-to-zoom is a purely visual magnification and doesn't reflow the page layout.


Terminal tools improvements
This release improves the agent experience for running terminal commands in the background.

Send input to background terminals
Previously, background terminals were read-only, with only get_terminal_output available. This was particularly limiting when a foreground terminal timed out and moved to the background, as the agent could no longer interact with it.

With the new send_to_terminal tool, the agent can continue interacting with background terminals. For example, if an SSH session times out while waiting for a password prompt, the agent can still send the required input to complete the connection.

Background terminal notifications (Experimental)
Setting:   chat.tools.terminal.backgroundNotifications

Previously, when a terminal command was running in the background, the agent had to manually call get_terminal_output to check on its status. There was no way to know when the command completed or needed input.

With the new experimental   chat.tools.terminal.backgroundNotifications setting, the agent is automatically notified when a background terminal command finishes or requires user input. This also applies to foreground terminals that time out and are moved to the background. The agent can then take appropriate action, such as reviewing the output or providing input via the send_to_terminal tool.

Deprecated features and settings
New deprecations in this release
None

Upcoming deprecations
Edit Mode is officially deprecated as of VS Code version 1.110. Users can temporarily re-enable Edit Mode via VS Code setting   chat.editMode.hidden . This setting will remain supported through version 1.125. Beginning with version 1.125, Edit Mode will be fully removed and can no longer be enabled via settings.
Notable fixes
vscode#304257 - terminal restart for integrated pwsh can cause cursor to go to wrong location
vscode#304679 - Caps Lock key inserts raw escape sequence "[57358u" in Claude Code inside VS Code terminal
Thank you
Contributions to our issue tracking:

@gjsjohnmurray (John Murray)
@RedCMD (RedCMD)
@IllusionMH (Andrii Dieiev)
@albertosantini (Alberto Santini)
Contributions to vscode:

@andysharman: feat: add A/B test for default new session mode PR #306532
@chetanr-25: Improve type safety for dynamic stylesheet rules PR #288651
@danplischke (Dan Plischke): Add default-folder, default-workspace and disable-telemetry to serve-web CLI PR #299512
@mossgowild (moss): fix: prevent catastrophic regex backtracking in _extractImagesFromOutput PR #307447
@xingsy97 (xingsy97): comments: fix memory leak when recycling tree items in comment panel PR #304666
@yogeshwaran-c (Yogeshwaran C)
fix: scope editor service in window title to own editor groups container PR #306226
fix: preserve 'Wait for Breakpoint' selection when reopening breakpoint widget PR #306564
fix: include additional toggles in find input arrow key navigation PR #306559
feat: show coverage indicators in minimap PR #307250
fix: improve test coverage filter quickpick readability PR #306562
fix: treat unrecognized @-prefixed text as regular filter in test explorer PR #307555
We really appreciate people trying our new features as soon as they are ready, so check back here often and learn what's new.

If you'd like to read release notes for previous VS Code versions, go to Updates on code.visualstudio.com.

