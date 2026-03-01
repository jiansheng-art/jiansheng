export function toPlainText(value: string | undefined | null): string {
  if (!value)
    return '';

  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\+\+([^+]+)\+\+/g, '$1')
    .trim();
}
