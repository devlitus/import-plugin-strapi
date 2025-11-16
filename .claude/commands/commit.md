# /commit

Make a git commit with a custom message (without Claude Code signature).

Usage:
1. Stage your changes: `git add <files>`
2. Run: `/commit "Your commit message here"`

The command will create a clean commit without the automatic Claude Code signature and Co-Authored-By footer.

Example:
```
/commit "fix: resolve authentication bug"
```

This expands to instructions for making a clean, simple git commit.
