<#
.SYNOPSIS
  Install the harness Profile and register the plugin marketplace for Claude Code (Windows).
.DESCRIPTION
  1. Copies profile/CLAUDE.md to ~/.claude/CLAUDE.md (backs up an existing non-harness file).
  2. Merges the "jiranon" marketplace and enables harness@jiranon in ~/.claude/settings.json.
  3. Prints the remaining manual step (/plugin install inside Claude Code, or a restart).
.PARAMETER Update
  Re-copy the Profile even if one is installed (same as re-running; kept for readability).
.PARAMETER Uninstall
  Remove the Profile (only if it is the harness one) and the settings entries this script added.
.PARAMETER Local
  Register the marketplace from this local clone instead of GitHub (for developing the harness itself).
#>
[CmdletBinding()]
param(
  [switch]$Update,
  [switch]$Uninstall,
  [switch]$Local
)
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ClaudeDir = Join-Path $HOME '.claude'
$ProfileSrc = Join-Path $Root 'profile\CLAUDE.md'
$ProfileDst = Join-Path $ClaudeDir 'CLAUDE.md'
$Settings = Join-Path $ClaudeDir 'settings.json'
$Marker = 'github.com/Jiranon-K/harness'

New-Item -ItemType Directory -Force -Path $ClaudeDir | Out-Null

function Read-Settings {
  if (Test-Path $Settings) { return (Get-Content $Settings -Raw | ConvertFrom-Json) }
  return [pscustomobject]@{}
}
function Write-Settings($obj) {
  $json = $obj | ConvertTo-Json -Depth 10
  [System.IO.File]::WriteAllText($Settings, $json + "`n", (New-Object System.Text.UTF8Encoding $false))
}
function Ensure-Prop($obj, $name) {
  if (-not ($obj.PSObject.Properties.Name -contains $name)) { $obj | Add-Member -NotePropertyName $name -NotePropertyValue ([pscustomobject]@{}) }
  return $obj.$name
}

if ($Uninstall) {
  if ((Test-Path $ProfileDst) -and ((Get-Content $ProfileDst -Raw) -match [regex]::Escape($Marker))) {
    Remove-Item $ProfileDst; Write-Host "removed $ProfileDst"
  } else { Write-Host "profile not installed by harness; left alone" }
  $s = Read-Settings
  if ($s.PSObject.Properties.Name -contains 'enabledPlugins') { $s.enabledPlugins.PSObject.Properties.Remove('harness@jiranon') }
  if ($s.PSObject.Properties.Name -contains 'extraKnownMarketplaces') { $s.extraKnownMarketplaces.PSObject.Properties.Remove('jiranon') }
  Write-Settings $s
  Write-Host "settings.json: removed marketplace jiranon and harness@jiranon"
  exit 0
}

# 1. Profile
if ((Test-Path $ProfileDst) -and -not ((Get-Content $ProfileDst -Raw) -match [regex]::Escape($Marker))) {
  $bak = "$ProfileDst.bak-$(Get-Date -Format yyyyMMdd-HHmmss)"
  Copy-Item $ProfileDst $bak
  Write-Host "existing ~/.claude/CLAUDE.md is not the harness Profile; backed up to $bak"
}
Copy-Item $ProfileSrc $ProfileDst -Force
Write-Host "profile -> $ProfileDst"

# 2. settings.json (merge, never overwrite other keys)
$s = Read-Settings
$mk = Ensure-Prop $s 'extraKnownMarketplaces'
if ($Local) {
  $src = [pscustomobject]@{ source = 'directory'; path = $Root }
} else {
  $src = [pscustomobject]@{ source = 'github'; repo = 'Jiranon-K/harness' }
}
if ($mk.PSObject.Properties.Name -contains 'jiranon') { $mk.jiranon = [pscustomobject]@{ source = $src } }
else { $mk | Add-Member -NotePropertyName 'jiranon' -NotePropertyValue ([pscustomobject]@{ source = $src }) }
$ep = Ensure-Prop $s 'enabledPlugins'
if ($ep.PSObject.Properties.Name -contains 'harness@jiranon') { $ep.'harness@jiranon' = $true }
else { $ep | Add-Member -NotePropertyName 'harness@jiranon' -NotePropertyValue $true }
Write-Settings $s
Write-Host "settings.json: marketplace jiranon ($(if ($Local) { 'local: ' + $Root } else { 'github: Jiranon-K/harness' })), enabledPlugins.harness@jiranon = true"

# 3. Next steps
Write-Host ""
Write-Host "Next:"
Write-Host "  1. Restart Claude Code (or run /plugin marketplace update jiranon, then /plugin install harness@jiranon)."
Write-Host "  2. In a project: /harness:init"
Write-Host "  3. Optional companion: https://github.com/Jiranon-K/agent-skills"
