import { useState, useId } from "react";
import {
  Check,
  Plus,
  Minus,
  X,
  Maximize2,
  Minimize2,
  TestTube2,
  Clock,
  Calendar,
  MapPin,
  Thermometer,
  User,
  FlaskConical,
} from "lucide-react";
import TubeGraphic from "./TubeGraphic";
import { TUBES_CATALOG } from "./tubeTypes";

export default function SampleCollectionModal({
  isOpen,
  initialSpecimens = [],
  patient,
  order,
  onSave,
  onClose,
}) {
  const [specimens, setSpecimens] = useState(() => initialSpecimens);
  const [selectedNewSpecimenId, setSelectedNewSpecimenId] = useState(
    TUBES_CATALOG[0]?.id || "serum_sst",
  );
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const baseId = useId();

  if (!isOpen) return null;

  // Toggle all tubes collected state
  const allCollected =
    specimens.length > 0 && specimens.every((s) => s.collected);
  function handleToggleCollectAll() {
    const nextState = !allCollected;
    setSpecimens((prev) =>
      prev.map((s) => ({
        ...s,
        collected: nextState,
        status: nextState ? "Collected" : "Pending",
      })),
    );
  }

  // Update a single specimen field
  function updateSpecimen(index, field, value) {
    setSpecimens((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "collected") {
          updated.status = value ? "Collected" : "Pending";
        }
        if (field === "status") {
          updated.collected = value === "Collected";
        }
        if (field === "specimenId") {
          const newDef = TUBES_CATALOG.find((t) => t.id === value);
          if (newDef) {
            updated.tubeDef = newDef;
            updated.specimenName = newDef.name;
          }
        }
        return updated;
      }),
    );
  }

  // Stepper increment / decrement
  function adjustQuantity(index, delta) {
    setSpecimens((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) }
          : item,
      ),
    );
  }

  // Add a new specimen tube
  function handleAddSpecimen() {
    const def = TUBES_CATALOG.find((t) => t.id === selectedNewSpecimenId);
    if (!def) return;

    const newSpecimen = {
      specimenId: def.id,
      specimenName: def.name,
      tubeDef: def,
      quantity: 1,
      collected: false,
      status: "Pending",
      phlebotomist: "Staff Phlebotomist",
      collectionDate: new Date().toISOString().split("T")[0],
      collectionTime: new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      site: def.defaultSite || "Left Arm (Median Cubital)",
      temperature: def.defaultTemp || "Room Temperature (20-25°C)",
      assignedTests: ["Manual Add / Additional Tube"],
    };

    setSpecimens((prev) => [...prev, newSpecimen]);
  }

  // Remove a specimen tube
  function handleRemoveSpecimen(index) {
    setSpecimens((prev) => prev.filter((_, idx) => idx !== index));
  }

  // Handle Save
  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await onSave?.(specimens);
    } finally {
      setIsSubmitting(false);
    }
  }

  const collectedCount = specimens.filter((s) => s.collected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`flex flex-col bg-white rounded-xl shadow-2xl border border-slate-300 transition-all duration-200 overflow-hidden ${
          isMaximized
            ? "w-full h-full rounded-none"
            : "w-full max-w-5xl max-h-[92vh]"
        }`}
      >
        {/* ================================================================ */}
        {/* MODAL HEADER                                                     */}
        {/* ================================================================ */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-white text-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-600 text-white shadow-sm">
              <TestTube2 size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  Sample Collection Edit
                </h2>
              </div>
              {patient && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient:{" "}
                  <strong className="text-slate-800">
                    {patient.patient_name}
                  </strong>{" "}
                  ({patient.patientId || `P${patient.id}`}) · Order: #
                  {order?.order_no || "REC"}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              className="p-1.5 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title={isMaximized ? "Restore window" : "Maximize window"}
            >
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* SUB TOOLBAR: Quick Collect & Status Counter                      */}
        {/* ================================================================ */}
        <div className="border-b border-slate-200 px-5 py-2.5 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleCollectAll}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${
                allCollected
                  ? "bg-slate-700 text-white hover:bg-slate-800"
                  : "bg-teal-600 text-white hover:bg-teal-700"
              }`}
            >
              <Check size={14} />
              <span>
                {allCollected ? "Mark All Awaiting" : "Mark All Collected"}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-md bg-emerald-50 px-2 py-1 font-bold text-emerald-700 border border-emerald-200">
              {collectedCount} of {specimens.length} Collected
            </span>
          </div>
        </div>

        {/* ================================================================ */}
        {/* SPECIMEN TUBE CARDS GRID                                         */}
        {/* ================================================================ */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100/70 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {specimens.map((item, index) => {
              const def = item.tubeDef || TUBES_CATALOG[0];
              const uniqueKey = `${item.specimenId || index}_${index}`;
              const isCollected = Boolean(item.collected);

              return (
                <div
                  key={uniqueKey}
                  className={`flex flex-col rounded-xl border bg-white shadow-xs transition-all overflow-hidden ${
                    isCollected
                      ? "border-emerald-300 ring-1 ring-emerald-400/30"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                  style={{
                    borderTop: `4px solid ${def.capColor || "#0d9488"}`,
                  }}
                >
                  {/* Card Header Bar */}
                  <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2 bg-slate-50/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-3 w-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: def.capColor || "#0d9488" }}
                      />
                      <select
                        value={item.specimenId || def.id}
                        onChange={(e) =>
                          updateSpecimen(index, "specimenId", e.target.value)
                        }
                        className="font-bold text-xs text-slate-900 bg-transparent border-0 p-0 outline-none focus:ring-0 cursor-pointer max-w-45 truncate"
                      >
                        {TUBES_CATALOG.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Stepper & Index & Remove Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Quantity Stepper */}
                      <div className="inline-flex items-center rounded-md border border-slate-300 bg-white shadow-2xs">
                        <button
                          type="button"
                          onClick={() => adjustQuantity(index, -1)}
                          className="px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 cursor-pointer"
                          title="Decrease tube count"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="px-2 font-mono font-bold text-xs text-slate-800">
                          {item.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustQuantity(index, 1)}
                          className="px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 cursor-pointer"
                          title="Increase tube count"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      {/* Index Badge */}
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                        #{index + 1}
                      </span>

                      {/* Delete Tube Button (Cleanly spaced, NO overlap!) */}
                      {specimens.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecimen(index)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Remove this specimen"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Content: Left Graphic + Right Form Fields */}
                  <div className="flex items-stretch gap-3.5 p-3.5">
                    {/* LEFT: Realistic Vacutainer Tube / Container Graphic */}
                    <div className="flex flex-col items-center justify-center shrink-0 w-16 pt-0.5">
                      <TubeGraphic
                        tubeDef={def}
                        className="w-14 h-36 drop-shadow-xs"
                      />
                      <span
                        className="mt-1 inline-flex items-center rounded px-1.5 py-0.5 text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-700 border"
                        style={{
                          borderColor: `${def.capColor}55`,
                          backgroundColor: `${def.capColor}15`,
                        }}
                      >
                        {def.capLabel || def.name}
                      </span>
                    </div>

                    {/* RIGHT: Input Controls */}
                    <div className="flex-1 min-w-0 space-y-2.5">
                      {/* Status + Toggle Switch Bar */}
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/80 p-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              isCollected
                                ? "bg-emerald-500 animate-pulse"
                                : "bg-slate-400"
                            }`}
                          />
                          <span className="text-xs font-bold text-slate-800">
                            {isCollected
                              ? "Sample Collected"
                              : "Awaiting Collection"}
                          </span>
                        </div>

                        {/* Switch Slider */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
                            {isCollected ? "Done" : "Mark"}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateSpecimen(index, "collected", !isCollected)
                            }
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isCollected ? "bg-emerald-600" : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                isCollected ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Phlebotomist & Site */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label
                            htmlFor={`${baseId}_phleb_${index}`}
                            className="flex items-center gap-1 text-[10.5px] font-bold text-slate-600 mb-1"
                          >
                            <User size={11} className="text-slate-400" />
                            <span>Phlebotomist</span>
                          </label>
                          <select
                            id={`${baseId}_phleb_${index}`}
                            value={item.phlebotomist || "Staff Phlebotomist"}
                            onChange={(e) =>
                              updateSpecimen(
                                index,
                                "phlebotomist",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-teal-600"
                          >
                            <option value="Staff Phlebotomist">
                              Staff Phlebotomist
                            </option>
                            <option value="Lead Phlebotomist">
                              Lead Phlebotomist
                            </option>
                            <option value="Dr. Lab Incharge">
                              Dr. Lab Incharge
                            </option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor={`${baseId}_site_${index}`}
                            className="flex items-center gap-1 text-[10.5px] font-bold text-slate-600 mb-1"
                          >
                            <MapPin size={11} className="text-slate-400" />
                            <span>Collection Site</span>
                          </label>
                          <select
                            id={`${baseId}_site_${index}`}
                            value={item.site || def.defaultSite}
                            onChange={(e) =>
                              updateSpecimen(index, "site", e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-teal-600 truncate"
                          >
                            <option value="Left Arm (Median Cubital)">
                              Left Arm (Median Cubital)
                            </option>
                            <option value="Right Arm (Median Cubital)">
                              Right Arm (Median Cubital)
                            </option>
                            <option value="Clean Catch Midstream">
                              Clean Catch Midstream
                            </option>
                            <option value="Capillary / Fingerprick">
                              Capillary / Fingerprick
                            </option>
                            <option value="Phlebotomy Desk 1">
                              Phlebotomy Desk 1
                            </option>
                          </select>
                        </div>
                      </div>

                      {/* Date, Time & Temperature */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label
                            htmlFor={`${baseId}_date_${index}`}
                            className="flex items-center gap-1 text-[10.5px] font-bold text-slate-600 mb-1"
                          >
                            <Calendar size={11} className="text-slate-400" />
                            <span>Date</span>
                          </label>
                          <input
                            id={`${baseId}_date_${index}`}
                            type="date"
                            value={item.collectionDate || ""}
                            onChange={(e) =>
                              updateSpecimen(
                                index,
                                "collectionDate",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-teal-600 font-mono"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`${baseId}_time_${index}`}
                            className="flex items-center gap-1 text-[10.5px] font-bold text-slate-600 mb-1"
                          >
                            <Clock size={11} className="text-slate-400" />
                            <span>Time</span>
                          </label>
                          <input
                            id={`${baseId}_time_${index}`}
                            type="time"
                            value={item.collectionTime || "12:00"}
                            onChange={(e) =>
                              updateSpecimen(
                                index,
                                "collectionTime",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-teal-600 font-mono"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`${baseId}_temp_${index}`}
                            className="flex items-center gap-1 text-[10.5px] font-bold text-slate-600 mb-1"
                          >
                            <Thermometer size={11} className="text-slate-400" />
                            <span>Storage Temp</span>
                          </label>
                          <input
                            id={`${baseId}_temp_${index}`}
                            type="text"
                            placeholder="Temperature"
                            value={item.temperature || def.defaultTemp}
                            onChange={(e) =>
                              updateSpecimen(
                                index,
                                "temperature",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-800 outline-none focus:border-teal-600 truncate"
                          />
                        </div>
                      </div>

                      {/* Assigned Tests Tag */}
                      <div className="pt-0.5">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Prescribed Tests in this Tube:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {item.assignedTests &&
                          item.assignedTests.length > 0 ? (
                            item.assignedTests.map((tName, tIdx) => (
                              <span
                                key={tIdx}
                                className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800 border border-teal-200"
                              >
                                <FlaskConical
                                  size={10}
                                  className="text-teal-600"
                                />
                                <span>{tName}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              No specific test mapped
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================ */}
        {/* BOTTOM ACTION BAR                                                */}
        {/* ================================================================ */}
        <div className="border-t border-slate-300 px-5 py-3 bg-white flex items-center justify-between gap-3 shrink-0 flex-wrap">
          {/* Add Additional Specimen Dropdown + Button */}
          <div className="flex items-center gap-2">
            <select
              value={selectedNewSpecimenId}
              onChange={(e) => setSelectedNewSpecimenId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-teal-600"
            >
              {TUBES_CATALOG.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.displayName}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddSpecimen}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-900 transition cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Specimen Tube</span>
            </button>
          </div>

          {/* Save & Close buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition cursor-pointer"
            >
              <Check size={15} />
              <span>
                {isSubmitting ? "Saving..." : "Save & Proceed to Receipt"}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <X size={14} />
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
