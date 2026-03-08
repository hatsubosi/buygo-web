/**
 * Fetches all pages from a paginated API endpoint.
 *
 * @param fetcher   - Called with the current pageToken, returns one page of results
 * @param getItems  - Extracts the items array from the page result
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function paginateAll<TPage extends { nextPageToken: string }, TItem>(
  fetcher: (pageToken: string) => Promise<TPage>,
  getItems: (res: TPage) => TItem[],
): Promise<TItem[]> {
  const all: TItem[] = [];
  let pageToken = '';
  for (;;) {
    const res = await fetcher(pageToken);
    all.push(...getItems(res));
    if (!res.nextPageToken) break;
    pageToken = res.nextPageToken;
  }
  return all;
}
