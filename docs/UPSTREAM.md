# UPSTREAM — codex-ui-kit

Reference values in this project were cross-checked against
[`JaminZhou/codex-ui-kit`](https://github.com/JaminZhou/codex-ui-kit),
package `codex-ui-kit@0.1.2`, **MIT licensed**.

No component code from it is used here. This repo is plain HTML/CSS/JS; that project is React.
What was taken is a set of numeric design values, each annotated inline in `app/css/tokens.css`
with its upstream token name.

## Values taken

| upstream token | value | used for |
|---|---|---|
| `--codex-ui-app-sidebar-width` | `17.125rem` = 274px | `--sidebar-width` |
| `--codex-ui-app-window-chrome-height` | `2.875rem` = 46px | `--titlebar-height` |
| `--codex-ui-conversation-thread-header-height` | `2.875rem` = 46px | `.surface-header` |
| `--codex-ui-thread-content-max-width` | `48rem` = 768px | `--thread-max-width` |
| `--codex-ui-conversation-thread-content-top-inset` | `2.0625rem` = 33px | `--thread-inset-top` |
| `--codex-ui-thread-turn-gap` | `spacing × 3` = 12px | `--turn-gap` |
| `--codex-ui-conversation-thread-user-turn-gap` | `2.125rem` = 34px | user turn margin |
| `--codex-ui-conversation-thread-font-size` | `.875rem` = 14px | `--text-lg` |
| `--codex-ui-conversation-thread-line-height` | `1.375rem` = 22px | `--leading-thread` |
| `--codex-ui-radius-composer` | `1.5625rem` = 25px | `--radius-composer` |
| `--codex-ui-composer-control-size` | `1.75rem` = 28px | `--composer-control` |
| `--codex-ui-font-weight-shell` | `445` | `--font-weight-shell` |
| `--codex-ui-background-surface` (dark) | `gray-900` = `#181818` | `--surface` |
| `--codex-ui-conversation-thread-background` (dark) | `#171717` | `--surface-2` |
| `--codex-ui-text-foreground` (light) | `#1a1c1f` | `--text` |
| `--codex-ui-border` (dark) | `white 8%` | `--border` |
| `--codex-ui-border-heavy` (dark) | `white 16%` | `--border-strong` |

## Where it disagrees with the renderer

The renderer bundle (`app-shared-*.css`, extracted from the installed app) is treated as ground
truth. Three steps in the upstream ramp don't match it:

| token | codex-ui-kit | renderer |
|---|---|---|
| `gray-450` | `#626262` | `#767676` |
| `gray-500` | `#5d5d5d` | no such step |
| `gray-750` | `#282828` | that's `gray-250`'s dark value |

The upstream ramp is also incomplete — missing 25 / 150 / 200 / 250 / 350 / 400 / 650 / 850 /
925 / 950 / 975. This project uses the renderer values for all of those.

## Why not just depend on it

It's a React component library with an ESM-only build and a 690 KB stylesheet. This project is a
static page with no build step, so the two don't compose. The values travel; the code doesn't.

If you want the React version — 58 components covering settings, MCP, PRs, terminals, subagents —
go use the real thing.
