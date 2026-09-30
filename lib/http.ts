export function jsonError(status: number, error: string) {
  return Response.json({ error }, { status });
}
