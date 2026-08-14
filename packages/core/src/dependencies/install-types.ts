export interface InstallCommand {
  command: string;
  args: string[];
  cwd?: string;
  detail?: string;
}
