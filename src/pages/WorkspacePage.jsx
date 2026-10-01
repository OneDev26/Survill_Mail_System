import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  StickyNote,
  CheckCheck,
} from "lucide-react";
import { itemSaved, itemDeleted } from "../redux/slice/workspaceSlice";
import { composeOpened, notify } from "../redux/slice/uiSlice";
import { Avatar, IconButton } from "../components/Ui";
import { initials } from "../utils/mail";
import WorkspaceEditor from "../components/WorkspaceEditor";
import ConfirmDialog from "../components/ConfirmDialog";

const config = {
  contacts: {
    title: "Contacts",
    single: "contact",
    description: "Good work starts with good connections.",
    icon: Users,
  },
  tasks: {
    title: "Tasks",
    single: "task",
    description: "A clear view of what comes next.",
    icon: CheckCheck,
  },
  notes: {
    title: "Notes",
    single: "note",
    description: "A little space for your next big idea.",
    icon: StickyNote,
  },
  calendar: {
    title: "Calendar",
    single: "event",
    description: "Make time for the things that matter.",
    icon: CalendarDays,
  },
};
const localDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export default function WorkspacePage({ kind }) {
  const collection = kind === "calendar" ? "events" : kind;
  const items = useSelector((state) => state.workspace[collection]);
  const { title, single, description, icon: Icon } = config[kind];
  const dispatch = useDispatch();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [editor, setEditor] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [selectedDate, setSelectedDate] = useState(localDate(new Date()));
  const [month, setMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const filtered = items
    .filter(
      (item) =>
        Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (kind !== "tasks" ||
          filter === "All" ||
          item.done === (filter === "Completed")) &&
        (kind !== "calendar" || Boolean(query) || item.date === selectedDate),
    )
    .sort((a, b) =>
      kind === "contacts"
        ? a.name.localeCompare(b.name)
        : kind === "calendar"
          ? `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
          : 0,
    );
  function save(item) {
    dispatch(itemSaved({ collection, item }));
    setEditor(null);
    dispatch(
      notify({
        text: `${title === "Calendar" ? "Event" : single[0].toUpperCase() + single.slice(1)} saved.`,
      }),
    );
  }
  function shiftMonth(offset) {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setSelectedDate(localDate(next));
  }
  const days = Array.from(
    {
      length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
    },
    (_, index) => index + 1,
  );
  return (
    <div className="thin-scrollbar flex-1 overflow-y-auto p-5 sm:p-8">
      <div className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-semibold">
              {title}
              <span className="rounded-lg bg-brand-50 px-2 py-1 text-xs text-brand-600">
                {items.length}
              </span>
            </h1>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </div>
          <button
            className="btn-primary"
            onClick={() =>
              setEditor(
                kind === "calendar"
                  ? { date: selectedDate, time: "09:00", endTime: "09:30" }
                  : kind === "tasks"
                    ? { done: false, due: localDate(new Date()) }
                    : {},
              )
            }
          >
            <Plus size={17} />
            New {single}
          </button>
        </div>
        <div className="my-6 flex flex-wrap items-center gap-4">
          <div className="flex min-w-64 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
            <Search size={16} className="text-slate-400" />
            <input
              aria-label={`Search ${title.toLowerCase()}`}
              className="w-full bg-transparent py-2.5 text-sm outline-none"
              placeholder={`Search ${title.toLowerCase()}…`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          {kind === "tasks" && (
            <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
              {["All", "Open", "Completed"].map((value) => (
                <button
                  key={value}
                  className={`rounded-md px-3 py-1.5 text-xs ${filter === value ? "bg-brand-50 text-brand-600" : "text-slate-500"}`}
                  onClick={() => setFilter(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          )}
        </div>
        {kind === "calendar" && (
          <section className="card mb-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">
                {month.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  className="text-xs text-brand-600"
                  onClick={() => {
                    setMonth(
                      new Date(
                        new Date().getFullYear(),
                        new Date().getMonth(),
                        1,
                      ),
                    );
                    setSelectedDate(localDate(new Date()));
                    setQuery("");
                  }}
                >
                  Today
                </button>
                <IconButton
                  icon={ChevronLeft}
                  label="Previous month"
                  onClick={() => shiftMonth(-1)}
                />
                <IconButton
                  icon={ChevronRight}
                  label="Next month"
                  onClick={() => shiftMonth(1)}
                />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span
                  key={day}
                  className="pb-2 text-center text-[11px] text-slate-400"
                >
                  {day}
                </span>
              ))}
              {Array.from({ length: month.getDay() }, (_, index) => (
                <span key={`empty-${index}`} />
              ))}
              {days.map((day) => {
                const date = localDate(
                  new Date(month.getFullYear(), month.getMonth(), day),
                );
                const events = items.filter((item) => item.date === date);
                return (
                  <button
                    key={date}
                    aria-label={`${date}, ${events.length} events`}
                    aria-pressed={selectedDate === date}
                    onClick={() => {
                      setSelectedDate(date);
                      setQuery("");
                    }}
                    className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border p-2 text-sm sm:min-h-20 ${selectedDate === date ? "border-brand-500 bg-brand-50 text-brand-600" : "border-slate-100 hover:bg-slate-50"} ${date === localDate(new Date()) ? "font-bold" : ""}`}
                  >
                    {day}
                    {events.length > 0 && (
                      <span className="size-1.5 rounded-full bg-brand-500" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-5 text-xs text-slate-500">
              {query
                ? "Search results from all dates"
                : `Schedule for ${new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
            </p>
          </section>
        )}
        {filtered.length === 0 ? (
          <div className="card flex min-h-60 flex-col items-center justify-center text-center">
            <span className="mb-4 rounded-2xl bg-brand-50 p-4 text-brand-500">
              <Icon size={28} />
            </span>
            <h2 className="font-semibold">
              {query
                ? "No matches found"
                : `No ${title.toLowerCase() === "calendar" ? "events on this day" : title.toLowerCase()} here yet`}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {query
                ? "Try another search."
                : `Add a ${single} to get started.`}
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-4 ${kind === "contacts" || kind === "notes" ? "sm:grid-cols-2 xl:grid-cols-3" : ""}`}
          >
            {filtered.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {kind === "contacts" && (
                    <Avatar initials={initials(item.name)} />
                  )}
                  {kind === "tasks" && (
                    <input
                      aria-label={`Complete ${item.title}`}
                      type="checkbox"
                      className="mt-1.5 size-4"
                      checked={Boolean(item.done)}
                      onChange={() =>
                        dispatch(
                          itemSaved({
                            collection,
                            item: { ...item, done: !item.done },
                          }),
                        )
                      }
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h2
                      className={`break-words text-sm font-semibold ${item.done ? "text-slate-400 line-through" : ""}`}
                    >
                      {item.name || item.title}
                    </h2>
                    {kind === "contacts" && (
                      <>
                        <p className="mt-1 break-all text-xs text-slate-500">
                          {item.email}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          {[item.company, item.phone]
                            .filter(Boolean)
                            .join(" · ") || "No additional details"}
                        </p>
                      </>
                    )}
                    {kind === "tasks" && (
                      <p
                        className={`mt-2 text-xs ${!item.done && item.due && item.due < localDate(new Date()) ? "text-red-500" : "text-slate-400"}`}
                      >
                        {item.due
                          ? `Due ${item.due}${!item.done && item.due < localDate(new Date()) ? " · Overdue" : ""}`
                          : "No due date"}
                      </p>
                    )}
                    {kind === "notes" && (
                      <p className="mt-3 line-clamp-6 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">
                        {item.body || "An empty page, ready for an idea."}
                      </p>
                    )}
                    {kind === "calendar" && (
                      <>
                        <p className="mt-2 flex items-center gap-2 text-xs text-brand-600">
                          <Clock size={13} />
                          {item.date} · {item.time}–{item.endTime}
                        </p>
                        {item.location && (
                          <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                            <MapPin size={13} />
                            {item.location}
                          </p>
                        )}
                        {item.description && (
                          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-500">
                            {item.description}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col">
                    <IconButton
                      icon={Pencil}
                      label={`Edit ${item.name || item.title}`}
                      onClick={() => setEditor(item)}
                    />
                    <IconButton
                      icon={Trash2}
                      label={`Delete ${item.name || item.title}`}
                      onClick={() => setConfirm(item)}
                    />
                  </div>
                </div>
                {kind === "contacts" && (
                  <button
                    className="mt-4 flex items-center gap-2 text-xs font-medium text-brand-600 hover:underline"
                    onClick={() => dispatch(composeOpened({ to: item.email }))}
                  >
                    <Mail size={14} />
                    Send message
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
      {editor && (
        <WorkspaceEditor
          collection={collection}
          initial={editor}
          items={items}
          onSave={save}
          onClose={() => setEditor(null)}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title={`Delete ${single}?`}
          description={`“${confirm.name || confirm.title}” will be permanently removed from this demo workspace.`}
          confirmLabel="Delete"
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            dispatch(itemDeleted({ collection, id: confirm.id }));
            setConfirm(null);
            dispatch(
              notify({
                text: `${single[0].toUpperCase() + single.slice(1)} deleted.`,
              }),
            );
          }}
        />
      )}
    </div>
  );
}
