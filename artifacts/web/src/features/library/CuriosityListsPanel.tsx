import { useCallback, useEffect, useState } from "react";

type CuriosityItem = { id: string; text: string; position: number };
type CuriosityList = { id: string; name: string; allowKinfolkUse: boolean; items: CuriosityItem[] };
type Payload = { list?: CuriosityList; lists?: CuriosityList[]; error?: string };

export function CuriosityListsPanel({ apiBase }: { apiBase: string }) {
  const [lists, setLists] = useState<CuriosityList[]>([]);
  const [name, setName] = useState("");
  const [newItems, setNewItems] = useState<Record<string, string>>({});
  const [nameEdits, setNameEdits] = useState<Record<string, string>>({});
  const [itemEdits, setItemEdits] = useState<Record<string, string>>({});
  const [memberConfirmed, setMemberConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [signedIn, setSignedIn] = useState(true);

  const request = useCallback(async (path: string, init?: RequestInit): Promise<Payload> => {
    const response = await fetch(`${apiBase}api/kinfolk/curiosity-lists${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      ...init,
    });
    const body = await response.json() as Payload;
    if (response.status === 401) { setSignedIn(false); throw new Error("Sign in to manage your private Curiosity Lists."); }
    if (!response.ok) throw new Error(body.error ?? "Your private list could not be updated.");
    return body;
  }, [apiBase]);
  const replace = (list: CuriosityList) => setLists((current) => current.map((entry) => entry.id === list.id ? list : entry));
  const load = useCallback(async () => {
    try { const body = await request(""); setLists(body.lists ?? []); setMessage(""); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Your private lists are unavailable."); }
  }, [request]);
  useEffect(() => { void load(); }, [load]);

  async function createList(event: React.FormEvent) {
    event.preventDefault();
    try {
      const body = await request("", { method: "POST", body: JSON.stringify({ name, memberConfirmed }) });
      if (body.list) { setLists((current) => [...current, body.list!]); setName(""); setMemberConfirmed(false); setMessage(""); }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Your private list could not be created."); }
  }
  async function renameList(list: CuriosityList) {
    try { const body = await request(`/${encodeURIComponent(list.id)}`, { method: "PATCH", body: JSON.stringify({ name: nameEdits[list.id] ?? list.name, memberConfirmed: true }) }); if (body.list) replace(body.list); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Your private list could not be changed."); }
  }
  async function setKinfolkUse(list: CuriosityList) {
    const next = !list.allowKinfolkUse;
    const prompt = next
      ? "Allow Kinfolk to use this list only when you deliberately choose it for a directly related request?"
      : "Turn off Kinfolk use for this list?";
    if (!window.confirm(prompt)) return;
    try { const body = await request(`/${encodeURIComponent(list.id)}/kinfolk-use`, { method: "PATCH", body: JSON.stringify({ allowKinfolkUse: next, memberConfirmed: true }) }); if (body.list) replace(body.list); }
    catch (error) { setMessage(error instanceof Error ? error.message : "The Kinfolk setting could not be changed."); }
  }
  async function addItem(list: CuriosityList) {
    try { const body = await request(`/${encodeURIComponent(list.id)}/items`, { method: "POST", body: JSON.stringify({ text: newItems[list.id] ?? "", memberConfirmed: true }) }); if (body.list) { replace(body.list); setNewItems((current) => ({ ...current, [list.id]: "" })); } }
    catch (error) { setMessage(error instanceof Error ? error.message : "Your private topic could not be added."); }
  }
  async function saveItem(list: CuriosityList, item: CuriosityItem) {
    try { const body = await request(`/${encodeURIComponent(list.id)}/items/${encodeURIComponent(item.id)}`, { method: "PATCH", body: JSON.stringify({ text: itemEdits[item.id] ?? item.text, memberConfirmed: true }) }); if (body.list) replace(body.list); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Your private topic could not be changed."); }
  }
  async function moveItem(list: CuriosityList, index: number, direction: -1 | 1) {
    const ordered = [...list.items].sort((a, b) => a.position - b.position); const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    try { const body = await request(`/${encodeURIComponent(list.id)}/items/order`, { method: "PUT", body: JSON.stringify({ itemIds: ordered.map((item) => item.id), memberConfirmed: true }) }); if (body.list) replace(body.list); }
    catch (error) { setMessage(error instanceof Error ? error.message : "The topic order could not be changed."); }
  }
  async function remove(path: string, listId?: string) {
    if (!window.confirm("Remove this private entry? This cannot be undone.")) return;
    try { await request(path, { method: "DELETE", body: JSON.stringify({ memberConfirmed: true }) }); setLists((current) => listId ? current.filter((list) => list.id !== listId) : current); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Your private entry could not be removed."); }
  }

  return (
    <section aria-labelledby="curiosity-lists-heading" className="mt-8 rounded-2xl border border-[#CA922B]/35 bg-[#FFF8E8] p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8D5C17]">Private learning space</p>
      <h2 className="mt-2 font-serif text-2xl font-bold text-[#2B1507]" id="curiosity-lists-heading">Things I Want To Learn</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#3A1F0E]/80">
        Keep your own topics and cultures to explore at your pace. List names and topics are encrypted at rest, private to you, and never shared with the community, Map, or Directory. Kinfolk does not use them unless you turn on the separately labeled setting for one list and deliberately choose that list for a directly related request.
      </p>
      {!signedIn ? <p className="mt-4 text-sm font-semibold text-[#8A2424]">Sign in to manage your private Curiosity Lists.</p> : null}
      {signedIn ? <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={(event) => void createList(event)}>
        <label className="sr-only" htmlFor="curiosity-list-name">New private list name</label>
        <input id="curiosity-list-name" maxLength={100} onChange={(event) => setName(event.target.value)} placeholder="For example: Caribbean foodways" required value={name} className="rounded-xl border border-[#3A1F0E]/20 bg-white px-4 py-3 text-[#2B1507]" />
        <button className="rounded-xl bg-[#2B1507] px-5 py-3 font-semibold text-white disabled:opacity-50" disabled={!memberConfirmed} type="submit">Create private list</button>
        <label className="sm:col-span-2 flex items-start gap-2 text-sm text-[#3A1F0E]/75"><input checked={memberConfirmed} onChange={(event) => setMemberConfirmed(event.target.checked)} type="checkbox" /> I confirm I want to save this private list.</label>
      </form> : null}
      {message ? <p className="mt-3 text-sm text-[#8A2424]}" role="status">{message}</p> : null}
      <div className="mt-5 space-y-4">
        {lists.map((list) => {
          const items = [...list.items].sort((a, b) => a.position - b.position);
          return <article className="rounded-xl border border-[#3A1F0E]/15 bg-white p-4" key={list.id}>
            <div className="flex flex-wrap gap-2">
              <label className="sr-only" htmlFor={`curiosity-name-${list.id}`}>Private list name</label>
              <input id={`curiosity-name-${list.id}`} maxLength={100} onChange={(event) => setNameEdits((current) => ({ ...current, [list.id]: event.target.value }))} value={nameEdits[list.id] ?? list.name} className="min-w-0 flex-1 rounded-lg border border-[#3A1F0E]/20 px-3 py-2 font-semibold text-[#2B1507]" />
              <button className="rounded-lg border border-[#8D5C17] px-3 py-2 text-sm font-semibold text-[#70480F]" onClick={() => void renameList(list)} type="button">Save name</button>
              <button className="rounded-lg border border-[#8A2424] px-3 py-2 text-sm font-semibold text-[#8A2424]" onClick={() => void remove(`/${encodeURIComponent(list.id)}`, list.id)} type="button">Remove list</button>
            </div>
            <label className="mt-4 flex items-start gap-3 rounded-lg border border-[#CA922B]/35 bg-[#FFF8E8] p-3 text-sm text-[#3A1F0E]/80">
              <input checked={list.allowKinfolkUse} onChange={() => void setKinfolkUse(list)} type="checkbox" />
              <span><strong className="text-[#2B1507]">Allow deliberate Kinfolk use for this list</strong><br />Off by default. This does not add anything to chat or memory. It applies only when you explicitly select this list for a directly related request.</span>
            </label>
            <ul className="mt-4 space-y-2" aria-label={`${list.name} topics`}>
              {items.map((item, index) => <li className="flex flex-wrap gap-2" key={item.id}>
                <input aria-label="Private topic" maxLength={500} onChange={(event) => setItemEdits((current) => ({ ...current, [item.id]: event.target.value }))} value={itemEdits[item.id] ?? item.text} className="min-w-0 flex-1 rounded-lg border border-[#3A1F0E]/15 px-3 py-2 text-sm" />
                <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => void saveItem(list, item)} type="button">Save</button>
                <button aria-label="Move topic earlier" className="rounded-lg border px-3 py-2" disabled={index === 0} onClick={() => void moveItem(list, index, -1)} type="button">↑</button>
                <button aria-label="Move topic later" className="rounded-lg border px-3 py-2" disabled={index === items.length - 1} onClick={() => void moveItem(list, index, 1)} type="button">↓</button>
                <button className="rounded-lg border border-[#8A2424] px-3 py-2 text-sm text-[#8A2424]" onClick={() => void remove(`/${encodeURIComponent(list.id)}/items/${encodeURIComponent(item.id)}`)} type="button">Remove</button>
              </li>)}
            </ul>
            <div className="mt-3 flex gap-2"><input aria-label="New private topic" maxLength={500} onChange={(event) => setNewItems((current) => ({ ...current, [list.id]: event.target.value }))} placeholder="A topic, culture, or question" value={newItems[list.id] ?? ""} className="min-w-0 flex-1 rounded-lg border border-[#3A1F0E]/15 px-3 py-2 text-sm" /><button className="rounded-lg bg-[#70480F] px-3 py-2 text-sm font-semibold text-white" onClick={() => void addItem(list)} type="button">Add topic</button></div>
          </article>;
        })}
      </div>
    </section>
  );
}
