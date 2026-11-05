"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { GymLocation } from "@/lib/types";
import { appStore } from "@/lib/store";
import { MapPin, Check, Plus, Star, Building2, Home, Trash2, X } from "lucide-react";

export interface GymSelectorDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedGymId?: string;
  onSelectGym: (gym: GymLocation) => void;
  title?: string;
  subtitle?: string;
}

export function GymSelectorDrawer({
  isOpen,
  onOpenChange,
  selectedGymId,
  onSelectGym,
  title = "Select Salle de Sport",
  subtitle = "Choose or register your training facility for accurate equipment & biomechanics tracking",
}: GymSelectorDrawerProps) {
  const [gyms, setGyms] = useState<GymLocation[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Refresh gyms whenever drawer opens
  useEffect(() => {
    if (isOpen) {
      setGyms(appStore.getUserGymLocations());
      setIsAddingNew(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const handleSelect = (gym: GymLocation) => {
    onSelectGym(gym);
    onOpenChange(false);
  };

  const handleSetDefault = (e: React.MouseEvent, gymId: string) => {
    e.stopPropagation();
    appStore.setDefaultGymLocation(gymId);
    setGyms([...appStore.getUserGymLocations()]);
  };

  const handleDelete = (e: React.MouseEvent, gymId: string) => {
    e.stopPropagation();
    if (gyms.length <= 1) {
      setErrorMsg("You must keep at least one training location.");
      return;
    }
    appStore.deleteGymLocation(gymId);
    const updated = appStore.getUserGymLocations();
    setGyms([...updated]);
    if (selectedGymId === gymId && updated.length > 0) {
      onSelectGym(updated[0]);
    }
  };

  const handleCreateGym = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setErrorMsg("Please enter the name of the gym.");
      return;
    }

    const created = appStore.addGymLocation({
      name: newName.trim(),
      address: newAddress.trim() || undefined,
      notes: newNotes.trim() || undefined,
      isDefault: newIsDefault,
    });

    setGyms([...appStore.getUserGymLocations()]);
    setNewName("");
    setNewAddress("");
    setNewNotes("");
    setNewIsDefault(false);
    setIsAddingNew(false);
    setErrorMsg(null);

    // Auto-select the newly added gym
    handleSelect(created);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-w-md mx-auto max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#0B0F17] border-slate-800 p-6 space-y-5 shadow-2xl"
      >
        <SheetHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>TRAINING LOCATIONS</span>
            </span>
          </div>

          <SheetTitle className="text-lg font-bold text-white tracking-tight">
            {title}
          </SheetTitle>

          <SheetDescription className="text-xs text-slate-400">
            {subtitle}
          </SheetDescription>
        </SheetHeader>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Existing Gyms List */}
        {!isAddingNew ? (
          <div className="space-y-2.5">
            {gyms.map((gym) => {
              const isSelected = gym.id === selectedGymId;
              const isHome = gym.name.toLowerCase().includes("home");

              return (
                <div
                  key={gym.id}
                  onClick={() => handleSelect(gym)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      : "bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "bg-slate-800 text-slate-400 border border-slate-700/60"
                      }`}
                    >
                      {isHome ? <Home className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs truncate">
                          {gym.name}
                        </span>
                        {gym.isDefault && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 flex-shrink-0">
                            <Star className="w-2.5 h-2.5 fill-amber-300" />
                            <span>Default</span>
                          </span>
                        )}
                      </div>

                      {gym.address && (
                        <p className="text-[11px] text-slate-400 truncate">
                          {gym.address}
                        </p>
                      )}

                      {gym.notes && (
                        <p className="text-[10px] text-slate-500 line-clamp-1 italic">
                          {gym.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!gym.isDefault && (
                      <button
                        type="button"
                        onClick={(e) => handleSetDefault(e, gym.id)}
                        title="Set as default salle de sport"
                        className="text-[10px] text-slate-500 hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {gyms.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, gym.id)}
                        title="Delete salle de sport"
                        className="text-[10px] text-slate-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-cyan-400/20 border border-cyan-400 text-cyan-300 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add New Gym Trigger Button */}
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="w-full py-3 px-4 rounded-2xl border border-dashed border-slate-700 hover:border-cyan-500/60 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-cyan-400 transition flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Add Another Salle de Sport / Gym</span>
            </button>
          </div>
        ) : (
          /* Add New Gym Form */
          <form onSubmit={handleCreateGym} className="space-y-3.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                New Salle de Sport
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">
                Salle Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Punch Lissasfa, Fitness Park Racine..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">
                Address / Neighborhood
              </label>
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="e.g. Lissasfa, Casablanca"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">
                Equipment & Machine Notes
              </label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g. Has seated lever chest press, 45° leg press, calibrated plates..."
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition resize-none"
              />
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newIsDefault}
                onChange={(e) => setNewIsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0 focus:ring-offset-0"
              />
              <span className="flex-1">Set as my default salle de sport</span>
              <Star className="w-3.5 h-3.5 text-amber-400" />
            </label>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 active:scale-98"
              >
                Save & Select
              </button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
