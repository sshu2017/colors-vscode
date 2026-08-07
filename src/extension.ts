import * as vscode from 'vscode';
import { hueFromHex, paletteFor, randomHue, WindowPalette } from './color';

const COLOR_KEYS = [
  'activityBar.background',
  'titleBar.activeBackground',
  'titleBar.activeForeground',
] as const;

function theme(): 'dark' | 'light' | 'revert' {
  return vscode.workspace
    .getConfiguration('windowColors')
    .get<'dark' | 'light' | 'revert'>('theme', 'dark');
}

function isLight(): boolean {
  return theme() === 'light';
}

// Only workspace-level customizations. We never write to global settings, so a
// window with no workspace folder is left uncolored and no window's color leaks
// to the others.
function workspaceCustomizations(): Record<string, string> {
  const info = vscode.workspace
    .getConfiguration('workbench')
    .inspect<Record<string, string>>('colorCustomizations');
  return { ...(info?.workspaceValue ?? {}) };
}

function writeCustomizations(cc: Record<string, string>): void {
  const wb = vscode.workspace.getConfiguration('workbench');
  const value = Object.keys(cc).length === 0 ? undefined : cc;
  void wb.update('colorCustomizations', value, vscode.ConfigurationTarget.Workspace);
}

function setPalette(palette: WindowPalette): void {
  const cc = workspaceCustomizations();
  cc['activityBar.background'] = palette.activityBar;
  cc['titleBar.activeBackground'] = palette.titleBar;
  cc['titleBar.activeForeground'] = palette.titleForeground;
  writeCustomizations(cc);
}

function clearColors(): void {
  const cc = workspaceCustomizations();
  for (const key of COLOR_KEYS) {
    delete cc[key];
  }
  writeCustomizations(cc);
}

function refresh(): void {
  if (theme() === 'revert') {
    clearColors();
    return;
  }
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    // Empty window (no folder): leave it uncolored.
    return;
  }
  const existing = workspaceCustomizations()['activityBar.background'];
  if (existing) {
    // The folder already has a color: keep it, re-deriving the title bar and
    // foreground in case the theme changed.
    const hue = hueFromHex(existing);
    if (hue !== null) {
      setPalette(paletteFor(hue, isLight() ? 'light' : 'dark'));
    }
  } else {
    // First time this folder is colored: roll a random color and persist it in
    // the workspace settings so it stays stable across reloads.
    setPalette(paletteFor(randomHue(), isLight() ? 'light' : 'dark'));
  }
}

export function activate(context: vscode.ExtensionContext): void {
  refresh();
  context.subscriptions.push(
    // A folder opened into (or closed from) this window.
    vscode.workspace.onDidChangeWorkspaceFolders(() => refresh()),
    // User changed windowColors.theme.
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('windowColors')) {
        refresh();
      }
    }),
  );
}

export function deactivate(): void {}
