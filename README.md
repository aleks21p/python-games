# python-games
Python Games by Aleks

## CI & Build Info

This repository includes a small GitHub Actions workflow that generates a `build-info.js` file for the Zombie Shooter game. The generated file contains three window globals used by the game to display build metadata in the menu:

- `window.BUILD_VERSION` — semantic tag (if present) or short commit
- `window.BUILD_COMMIT` — full commit SHA
- `window.BUILD_COMMIT_TIME` — commit timestamp (ISO)

Workflow location: `.github/workflows/update-build-info.yml`

How it runs
- By default the workflow runs on GitHub-hosted runners (`ubuntu-latest`). It gathers the latest commit info and the most recent git tag (if present) and produces a `build-info.js` file as a workflow artifact.
- There are two common ways to make that file available to the live site:
	1. Download the artifact in your deploy job and publish it to the web root alongside the game files (recommended for CI/CD).
 2. (Older approach) Commit the generated file back to the repository from the workflow. This is not used by default because it can complicate the repo history and require branch protection allowances.

Self-hosted runner (optional)

If you prefer builds to run on your own machine (no queueing and no hosted minutes), you can register a self-hosted runner for this repository. A self-hosted runner executes workflow jobs on your hardware.

Security note: self-hosted runners execute arbitrary workflow code. Run them only on machines you control and trust, preferably isolated or VMs.

Quick Windows (PowerShell) setup
1. In GitHub: Repository → Settings → Actions → Runners → New self-hosted runner. Choose Windows and copy the provided download URL and token.
2. On the runner machine (PowerShell) run the following commands, replacing `<DOWNLOAD_URL>` and `<TOKEN>` with the values GitHub provides:

```powershell
mkdir C:\actions-runner
cd C:\actions-runner
#$downloadUrl is from GitHub UI
#$token is the one-time token GitHub shows when creating the runner
Invoke-WebRequest -Uri "<DOWNLOAD_URL>" -OutFile actions-runner.zip
Expand-Archive .\actions-runner.zip -DestinationPath .
.
.\config.cmd --url https://github.com/aleks21p/python-games --token <TOKEN> --labels self-hosted
.
.\run.cmd
```

3. Confirm the runner appears as "online" in the GitHub Runners page. The existing workflow uses the label `self-hosted` if you change it to `runs-on: self-hosted`.

Run the runner in background
- Task Scheduler: create a task to run `C:\actions-runner\run.cmd` at logon.
- NSSM: install `run.cmd` as a Windows service using NSSM for a more robust service setup.

Notes
- If you have branch protection rules that forbid pushes by GitHub Actions, use the artifact approach or give the Actions bot permission to push.
- If you want help wiring the artifact into your deployment pipeline (download artifact + copy to web root), tell me which host/service you deploy to (GitHub Pages, S3, Netlify, etc.) and I can add a sample deploy step.
