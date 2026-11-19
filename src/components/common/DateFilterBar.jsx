import { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Clock,
  Sparkles,
} from "lucide-react";

/**
 * Format a Date to 'YYYY-MM-DD'
 */
export function toISODate(d) {
  if (!d) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Helper to check if a date string falls inside the chosen filter range.
 */
export function isDateWithinRange(dateStr, range) {
  if (!range || range.type === "all") return true;
  if (!dateStr) return false;

  const itemDate = new Date(dateStr);
  if (Number.isNaN(itemDate.getTime())) return false;

  const now = new Date();
  const todayStr = toISODate(now);

  if (range.type === "today") {
    return toISODate(itemDate) === todayStr;
  }

  if (range.type === "yesterday") {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return toISODate(itemDate) === toISODate(yesterday);
  }

  if (range.type === "this_month") {
    return (
      itemDate.getFullYear() === now.getFullYear() &&
      itemDate.getMonth() === now.getMonth()
    );
  }

  if (range.type === "last_month") {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return (
      itemDate.getFullYear() === lastMonth.getFullYear() &&
      itemDate.getMonth() === lastMonth.getMonth()
    );
  }

  if (range.type === "custom") {
    const itemISODate = toISODate(itemDate);
    if (range.fromDate && itemISODate < range.fromDate) return false;
    if (range.toDate && itemISODate > range.toDate) return false;
    return true;
  }

  return true;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DateFilterBar({
  range = { type: "all", fromDate: null, toDate: null },
  onRangeChange,
  totalCount,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  // Calendar View State (Year & Month)
  const [viewDate, setViewDate] = useState(() => {
    return range.fromDate ? new Date(range.fromDate) : new Date();
  });

  // Local Range selection state inside popover
  const [tempFrom, setTempFrom] = useState(range.fromDate);
  const [tempTo, setTempTo] = useState(range.toDate);
  const [hoverDate, setHoverDate] = useState(null);

  // Sync temp dates when range prop updates
  useEffect(() => {
    setTempFrom(range.fromDate);
    setTempTo(range.toDate);
    if (range.fromDate) {
      setViewDate(new Date(range.fromDate));
    }
  }, [range]);

  // Click outside listener to dismiss popover
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month overflow
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const dateStr = toISODate(new Date(year, month - 1, d));
      days.push({ day: d, dateStr, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = toISODate(new Date(year, month, i));
      days.push({ day: i, dateStr, isCurrentMonth: true });
    }

    // Next month overflow to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const dateStr = toISODate(new Date(year, month + 1, i));
      days.push({ day: i, dateStr, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  // Day selection click
  function handleDayClick(dateStr) {
    if (!tempFrom || (tempFrom && tempTo)) {
      setTempFrom(dateStr);
      setTempTo(null);
    } else if (tempFrom && !tempTo) {
      if (dateStr < tempFrom) {
        setTempTo(tempFrom);
        setTempFrom(dateStr);
      } else {
        setTempTo(dateStr);
      }
    }
  }

  // Quick Presets click handlers
  function applyPreset(presetType) {
    const now = new Date();
    if (presetType === "all") {
      onRangeChange?.({ type: "all", fromDate: null, toDate: null });
      setIsOpen(false);
      return;
    }

    if (presetType === "today") {
      const todayStr = toISODate(now);
      onRangeChange?.({ type: "today", fromDate: todayStr, toDate: todayStr });
      setIsOpen(false);
      return;
    }

    if (presetType === "yesterday") {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      const yStr = toISODate(y);
      onRangeChange?.({ type: "yesterday", fromDate: yStr, toDate: yStr });
      setIsOpen(false);
      return;
    }

    if (presetType === "this_month") {
      const first = toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
      const last = toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      onRangeChange?.({ type: "this_month", fromDate: first, toDate: last });
      setIsOpen(false);
      return;
    }

    if (presetType === "last_month") {
      const first = toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const last = toISODate(new Date(now.getFullYear(), now.getMonth(), 0));
      onRangeChange?.({ type: "last_month", fromDate: first, toDate: last });
      setIsOpen(false);
      return;
    }

    if (presetType === "last_7_days") {
      const past = new Date(now);
      past.setDate(now.getDate() - 6);
      onRangeChange?.({
        type: "custom",
        fromDate: toISODate(past),
        toDate: toISODate(now),
      });
      setIsOpen(false);
      return;
    }

    if (presetType === "last_30_days") {
      const past = new Date(now);
      past.setDate(now.getDate() - 29);
      onRangeChange?.({
        type: "custom",
        fromDate: toISODate(past),
        toDate: toISODate(now),
      });
      setIsOpen(false);
      return;
    }
  }

  function handleApplyCustom() {
    if (!tempFrom) return;
    const from = tempFrom;
    const to = tempTo || tempFrom;
    onRangeChange?.({
      type: "custom",
      fromDate: from,
      toDate: to,
    });
    setIsOpen(false);
  }

  // Active filter label text
  const labelText = useMemo(() => {
    switch (range.type) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "this_month":
        return "This Month";
      case "last_month":
        return "Last Month";
      case "custom":
        if (range.fromDate && range.toDate) {
          return `${range.fromDate} → ${range.toDate}`;
        }
        return "Custom Range";
      case "all":
      default:
        return "All Dates";
    }
  }, [range]);

  return (
    <div className="relative inline-flex items-center gap-1.5 flex-wrap">
      {/* Quick Filter Pill Buttons */}
      <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50/80 p-0.5 shadow-2xs text-xs">
        <button
          type="button"
          onClick={() => applyPreset("all")}
          className={`rounded-lg px-2.5 py-1.5 font-bold transition cursor-pointer ${
            range.type === "all"
              ? "bg-white text-teal-900 shadow-2xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => applyPreset("today")}
          className={`rounded-lg px-2.5 py-1.5 font-bold transition cursor-pointer ${
            range.type === "today"
              ? "bg-white text-teal-900 shadow-2xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Today
        </button>

        <button
          type="button"
          onClick={() => applyPreset("yesterday")}
          className={`rounded-lg px-2.5 py-1.5 font-bold transition cursor-pointer ${
            range.type === "yesterday"
              ? "bg-white text-teal-900 shadow-2xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Yesterday
        </button>

        <button
          type="button"
          onClick={() => applyPreset("this_month")}
          className={`rounded-lg px-2.5 py-1.5 font-bold transition cursor-pointer ${
            range.type === "this_month"
              ? "bg-white text-teal-900 shadow-2xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          This Month
        </button>

        <button
          type="button"
          onClick={() => applyPreset("last_month")}
          className={`rounded-lg px-2.5 py-1.5 font-bold transition cursor-pointer ${
            range.type === "last_month"
              ? "bg-white text-teal-900 shadow-2xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Last Month
        </button>
      </div>

      {/* Custom Range Trigger Button with Calendar Popover */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer shadow-2xs ${
            range.type === "custom"
              ? "border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-500/10"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <CalendarIcon size={14} className={range.type === "custom" ? "text-teal-600" : "text-slate-500"} />
          <span>{range.type === "custom" ? labelText : "Custom Date"}</span>
          {range.type === "custom" && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                applyPreset("all");
              }}
              title="Clear custom range"
              className="ml-1 rounded-full p-0.5 hover:bg-teal-200 text-teal-800"
            >
              <X size={12} />
            </span>
          )}
        </button>

        {/* Floating Calendar Popover */}
        {isOpen && (
          <div
            ref={popoverRef}
            className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-50 text-teal-700">
                  <CalendarIcon size={15} />
                </span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Custom Date Range
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Filter records between two dates
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Quick Presets Row inside Popover */}
            <div className="flex flex-wrap gap-1.5 py-2.5 border-b border-slate-100 text-[11px]">
              <button
                type="button"
                onClick={() => applyPreset("today")}
                className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => applyPreset("last_7_days")}
                className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => applyPreset("this_month")}
                className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => applyPreset("last_30_days")}
                className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition"
              >
                Last 30 Days
              </button>
            </div>

            {/* Calendar Navigation Bar */}
            <div className="mt-3 flex items-center justify-between px-1">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="text-xs font-bold text-slate-900">
                {MONTH_NAMES[month]} {year}
              </div>

              <button
                type="button"
                onClick={nextMonth}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Calendar Day Matrix */}
            <div className="mt-2">
              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 pb-1">
                {DAYS_SHORT.map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-xs">
                {calendarDays.map(({ day, dateStr, isCurrentMonth }) => {
                  const isStart = tempFrom === dateStr;
                  const isEnd = tempTo === dateStr;
                  const isSelected = isStart || isEnd;

                  // Check if in range
                  let inRange = false;
                  if (tempFrom && tempTo && dateStr >= tempFrom && dateStr <= tempTo) {
                    inRange = true;
                  } else if (tempFrom && !tempTo && hoverDate && dateStr >= tempFrom && dateStr <= hoverDate) {
                    inRange = true;
                  }

                  const todayStr = toISODate(new Date());
                  const isToday = dateStr === todayStr;

                  return (
                    <div
                      key={dateStr}
                      className={`relative py-0.5 text-center transition ${
                        inRange && !isSelected ? "bg-teal-50/80" : ""
                      } ${isStart && tempTo ? "rounded-l-lg" : ""} ${
                        isEnd ? "rounded-r-lg" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleDayClick(dateStr)}
                        onMouseEnter={() => setHoverDate(dateStr)}
                        className={`h-7 w-7 rounded-lg text-xs font-medium transition cursor-pointer mx-auto flex items-center justify-center ${
                          isSelected
                            ? "bg-teal-600 font-bold text-white shadow-xs"
                            : inRange
                            ? "text-teal-900 font-semibold"
                            : isCurrentMonth
                            ? "text-slate-800 hover:bg-slate-100"
                            : "text-slate-300 hover:bg-slate-50"
                        } ${isToday && !isSelected ? "border border-teal-500 font-bold text-teal-700" : ""}`}
                      >
                        {day}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Popover Footer */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="text-[11px] text-slate-600 font-mono">
                {tempFrom ? (
                  <span>
                    <strong className="text-slate-900">{tempFrom}</strong>
                    {tempTo && (
                      <>
                        {" "}→ <strong className="text-slate-900">{tempTo}</strong>
                      </>
                    )}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Select start & end date</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setTempFrom(null);
                    setTempTo(null);
                  }}
                  className="rounded-lg px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={handleApplyCustom}
                  disabled={!tempFrom}
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-teal-700 disabled:opacity-40 transition cursor-pointer"
                >
                  <Check size={13} />
                  <span>Apply</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Total Filtered Badge */}
      {typeof totalCount === "number" && (
        <span className="text-[11px] font-medium text-slate-400 pl-1">
          Showing <strong>{totalCount}</strong> records
        </span>
      )}
    </div>
  );
}
