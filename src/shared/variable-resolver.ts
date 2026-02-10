export function resolveVariables(
  input: string,
  variables: Record<string, string>,
): string {
  return input.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    return variables[name] ?? match
  })
}
