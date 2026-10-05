'use client';

import React, { useState } from 'react';
import { useBadmintonSession } from '@/hooks/useBadmintonSession';
import { AppTopBar } from '@/components/AppTopBar';
import { QuickConfigBar } from '@/components/QuickConfigBar';
import { CourtGrid } from '@/components/CourtGrid';
import { ScheduleTable } from '@/components/ScheduleTable';
import { PlayerRosterDrawer } from '@/components/PlayerRosterDrawer';
import { SessionSettingsPanel } from '@/components/SessionSettingsPanel';
import { NavigationDrawer, AppFeatureTab } from '@/components/NavigationDrawer';
import { ScheduleView } from '@/components/ScheduleView';

export default function DashboardPage() {
  const {
    state,
    stats,
    hydrated,
    canGenerate,
    currentRound,
    selectedRoundIndex,
    completedUpToIndex,
    setSelectedRoundIndex,
    shuffleSchedule,
    toggleMatchComplete,
    addPlayer,
    updatePlayer,
    toggleActive,
    archivePlayer,
    bulkSetActive,
    setActivePlayersByNames,
    updateSettings,
    resetSession,
    setAsDefault,
  } = useBadmintonSession();

  const [activeTab, setActiveTab] = useState<AppFeatureTab>('schedule');
  const [navOpen, setNavOpen] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse space-y-4 max-w-md w-full text-center">
          <div className="h-10 w-10 bg-emerald-500/20 rounded-xl mx-auto" />
          <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded-md w-3/4 mx-auto" />
          <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-md w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-0 flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      {/* Top Application Bar with Navigation Hamburger */}
      <AppTopBar
        sessionName={state.settings.sessionName}
        courtCount={state.settings.courtCount}
        gamesToGenerate={state.settings.gamesToGenerate}
        onOpenNavigation={() => setNavOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 max-w-[1440px] w-full mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <h1 className="sr-only">
          Intelligent Badminton Matchmaking &amp; Court Scheduling Dashboard
        </h1>

        {activeTab === 'schedule' ? (
          <ScheduleView
            sessionName={state.settings.sessionName}
            courtCount={state.settings.courtCount}
            players={state.players}
            onBackToRandomGames={() => setActiveTab('random-games')}
            onPullPlayersToShuffle={(names, courtName) => {
              setActivePlayersByNames(names, courtName);
              setActiveTab('random-games');
            }}
            onAddPlayerToDatabase={(name, skill) => {
              addPlayer(name, skill);
            }}
          />
        ) : (
          <>
            {/* 1. Direct Quick Configuration Bar for Court Count, Games, and Player */}
            <QuickConfigBar
              courtCount={state.settings.courtCount}
              gamesToGenerate={state.settings.gamesToGenerate}
              onUpdateCourtCount={(courts) => updateSettings({ courtCount: courts })}
              onUpdateGamesToGenerate={(games) => updateSettings({ gamesToGenerate: games })}
              onShuffle={shuffleSchedule}
              onOpenSettings={() => setSettingsOpen(true)}
              canGenerate={canGenerate}
              activeCount={stats.activePlayers}
              totalCount={stats.totalPlayers}
              onOpenPlayer={() => setRosterOpen(true)}
            />

            {/* 2. Interactive Visual Courts */}
            <section aria-labelledby="section-live-courts" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2
                    id="section-live-courts"
                    className="text-base font-semibold text-slate-900 dark:text-zinc-100"
                  >
                    Court Allocation &amp; Visual Pairs
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {currentRound
                      ? `Game ${currentRound.number} of ${state.rounds.length} — Balanced skill & mentor pairs`
                      : 'Awaiting random shuffle'}
                  </p>
                </div>
              </div>

              {/* Court Grid with Game Navigation */}
              <CourtGrid
                currentRound={currentRound}
                rounds={state.rounds}
                totalRounds={state.rounds.length}
                selectedRoundIndex={selectedRoundIndex}
                completedUpToIndex={completedUpToIndex}
                onSelectRoundIndex={setSelectedRoundIndex}
                onToggleMatchComplete={toggleMatchComplete}
                players={state.players}
                onShuffle={shuffleSchedule}
                canGenerate={canGenerate}
              />
            </section>

            {/* 4. Match Schedule Table: Clean Unified Random Shuffled Log (NO Live/Upcoming/History Tabs) */}
            <section aria-labelledby="section-schedule-log">
              <h2 id="section-schedule-log" className="sr-only">
                Match Schedule Random Shuffled Log
              </h2>
              <ScheduleTable
                rounds={state.rounds}
                players={state.players}
                settings={state.settings}
                onShuffle={shuffleSchedule}
                onSelectRound={setSelectedRoundIndex}
                selectedRoundIndex={selectedRoundIndex}
                completedUpToIndex={completedUpToIndex}
                onToggleMatchComplete={toggleMatchComplete}
              />
            </section>
          </>
        )}
      </main>

      {/* Slide-out Navigation Drawer (Hamburger Menu) */}
      <NavigationDrawer
        open={navOpen}
        onClose={() => setNavOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        sessionName={state.settings.sessionName}
        courtCount={state.settings.courtCount}
      />

      {/* Slide-out Player Management Drawer */}
      <PlayerRosterDrawer
        open={rosterOpen}
        onClose={() => setRosterOpen(false)}
        players={state.players}
        onAddPlayer={addPlayer}
        onUpdatePlayer={updatePlayer}
        onToggleActive={toggleActive}
        onArchivePlayer={archivePlayer}
        onBulkSetActive={bulkSetActive}
        onResetSession={resetSession}
        onSetAsDefault={setAsDefault}
      />

      {/* Slide-out Session Settings Panel */}
      <SessionSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={state.settings}
        onUpdateSettings={updateSettings}
      />
    </div>
  );
}
