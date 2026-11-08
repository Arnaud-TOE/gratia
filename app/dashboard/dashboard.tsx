'use client';

// The dashboard: the PayPal shell (./components) wrapped around a single AG Studio instance, which
// this file renders. Studio's configuration (data sources, theme, default report, AI) lives in
// ./studio. The shell owns saved reports, page names and navigation; Studio owns
// the report being edited. They meet in two places:
//   - the shell drives Studio through its AgStudioApi (setState, getState, undo, redo)
//   - Studio reports every change back through onStateUpdated, which only redraws the shell
//
// Nothing tracks edits as they happen. Save reads the report from Studio with getState(), and
// leaving a report compares Studio's state with the saved one there and then.

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  AgStudioAiModule,
  enableStudioDevValidations,
  type AgReportState,
  type AgStudioApi,
  type AgStudioMode,
} from 'ag-studio';
import { AgStudio, AgStudioProvider } from 'ag-studio-react';
import type { DashboardData } from '@/lib/dashboard-data';
import { useApprovals } from './components/approval-dialog';
import { AppShell } from './components/app-shell';
import {
  CreateReportDialog,
  DeleteReportDialog,
  ResetDemoDialog,
  UnsavedChangesDialog,
  type DashboardDialog,
} from './components/dialogs';
import { EmptyData } from './components/empty-data';
import { GiftToast } from './components/gift-toast';
import { ReportHeader } from './components/report-header';
import {
  blankReport,
  copyOf,
  defaultReport,
  findReport,
  initialReports,
  newId,
  remove,
  upsert,
  type SavedReport,
} from './reports-store';
import { pagesFor, pageTitlesFor } from './page-titles';
import { ReportsSidebar } from './components/sidebar';
import { DashboardSkeleton } from './components/skeleton';
import * as reportState from './report-state';
import { buildAi } from './studio/ai';
import { readVisit } from './visit';
import { buildStudioData, hasData } from './studio/data';
import { toolDisplay } from './studio/tool-display';
import { agStudioPayPalTheme } from './studio/theme';
import { gratiaWidgets, type GratiaRegistry } from './studio/widgets';
import { useLiveGifts } from './use-live-gifts';
import { useReports } from './use-reports';

if (process.env.NODE_ENV !== 'production') {
  enableStudioDevValidations();
}

type DashboardProps = {
  data: DashboardData;
  licenseKey?: string;
  /** OpenAI models the assistant may use; omitted when no key is configured, which hides the assistant. */
  aiModels?: string[];
};

type StudioHistory = { canUndo: boolean; canRedo: boolean };

const NO_HISTORY: StudioHistory = { canUndo: false, canRedo: false };

const noSubscription = () => () => {};

// The assistant goes by the job it does here.
const STUDIO_TEXT = {
  panelTitleAi: 'Your development director',
  aiMessageInputPlaceholder: 'Ask your director…',
};

// The report is laid out for a laptop or larger; a phone gets a way forward instead of a squeezed grid.
// It must not render the report as well: a phone browser widens the page to fit what is too wide for it,
// and everything else, this notice included, ends up off the screen.
function PhoneNotice() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-pp-canvas p-8 text-center font-paypal">
      <h1 className="text-2xl font-bold text-pp-navy">The team dashboard needs a bigger screen</h1>
      <p className="mt-3 max-w-sm text-pp-muted">Open this page on a laptop to see the report and talk to the director. On a phone, try what donors see.</p>
      <Image src="/app.png" width={2880} height={1800} sizes="100vw" alt="The Giving page of the team dashboard, with the latest gifts and who keeps coming back" className="mt-6 w-full max-w-md rounded-xl border border-pp-border" />
      <Link href="/donate" className="mt-6 rounded-full bg-pp-blue px-6 py-3 font-semibold text-white">
        See the donation page
      </Link>
    </main>
  );
}

const WIDE_ENOUGH = '(min-width: 768px)';

const watchWidth = (onChange: () => void) => {
  const query = window.matchMedia(WIDE_ENOUGH);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

// For things built once that need the current value later, like the agent's tools.
function latestValue<T>(initial: T) {
  let value = initial;
  return {
    get: () => value,
    set: (next: T) => {
      value = next;
    },
  };
}

export function Dashboard(props: DashboardProps) {
  // Saved reports live in localStorage, which only exists in the browser.
  const inBrowser = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  const wideEnough = useSyncExternalStore(
    watchWidth,
    () => window.matchMedia(WIDE_ENOUGH).matches,
    () => true,
  );
  if (!inBrowser) return <DashboardSkeleton />;
  return wideEnough ? <ReportsDashboard {...props} /> : <PhoneNotice />;
}

function ReportsDashboard({ data, licenseKey, aiModels }: DashboardProps) {
  const { store, latest, update, editReport } = useReports();
  const apiRef = useRef<AgStudioApi | null>(null);

  // The open report as it is in Studio now, unsaved edits included, for drawing the shell.
  // Null until Studio is ready.
  const [studioState, setStudioState] = useState<AgReportState | null>(null);
  const [history, setHistory] = useState<StudioHistory>(NO_HISTORY);
  const [mode, setMode] = useState<AgStudioMode>('view');
  const [dialog, setDialog] = useState<DashboardDialog>(null);

  const { reports } = store;
  // The open report, as it was last saved.
  const saved = findReport(reports, store.activeId) ?? reports[0];
  // Studio reads initialState once, when it is created, and starts on the open report; after that,
  // its state is read from Studio.
  const [initialState] = useState(() => reportState.withFiltersPanelFor('view', saved.state));
  const state = studioState ?? initialState;
  const studioData = useMemo(() => buildStudioData(data), [data]);
  // The agent asks here before PayPal sends anything on the rescue's behalf.
  const { requestApproval, approvalDialog } = useApprovals();
  // A gift made anywhere reaches this page within seconds, and the agent's tools read the latest data.
  const { arrival, dismissArrival } = useLiveGifts(data);
  // Read once per page load: a first visit, or what came in since the last one.
  const [visit] = useState(() => readVisit(data));
  const [latestData] = useState(() => latestValue(data));
  useEffect(() => latestData.set(data), [latestData, data]);
  // `ai` is read once, when Studio is created.
  // The director's open_new_page tool is built once, with Studio; it reaches the current handlers here.
  const [openPage] = useState(() => latestValue<(title: string) => string>(() => ''));
  const ai = useMemo(
    () => (aiModels?.length ? buildAi(aiModels, latestData.get, requestApproval, (title) => openPage.get()(title)) : undefined),
    [aiModels, latestData, requestApproval, openPage],
  );

  // --- Driving Studio ---------------------------------------------------------------
  const load = (
    report: SavedReport,
    selectedPageId = report.state.selectedPageId,
    nextMode = mode,
  ) => {
    const api = apiRef.current;
    if (!api) return;
    api.setState(
      reportState.withFiltersPanelFor(nextMode, {
        ...report.state,
        selectedPageId,
      }),
    );
    // Undo shouldn't step back into the previous report.
    api.clearHistory();
    setStudioState(api.getState());
    setHistory(NO_HISTORY);
    setMode(nextMode);
    update((current) => ({ ...current, activeId: report.id }));
  };
  const updateState = (next: (current: AgReportState) => AgReportState) => {
    const api = apiRef.current;
    if (api) api.setState(next(api.getState()));
  };
  const changeMode = (next: AgStudioMode) => {
    updateState((s) => reportState.withEditPanels(true, reportState.withFiltersPanelFor(next, s)));
    setMode(next);
  };
  // Studio creates the Compose and Data panels on entering edit mode, so they can only be tucked
  // away once it is there.
  const askingDirector = useRef(false);
  const [askedOnce, setAskedOnce] = useState(false);
  const askDirector = () => {
    askingDirector.current = true;
    setAskedOnce(true);
    changeMode('edit');
  };
  useEffect(() => {
    const api = apiRef.current;
    if (mode !== 'edit' || !askingDirector.current || !api) return;
    askingDirector.current = false;
    api.setState(reportState.withEditPanels(false, api.getState()));
  }, [mode]);

  // --- Saving -----------------------------------------------------------------------
  const save = () => {
    const api = apiRef.current;
    if (!api) return;
    const current = api.getState();
    editReport(saved.id, (report) => ({
      ...report,
      // Titles for exactly the pages being saved.
      pageTitles: pageTitlesFor({ pageTitles: report.pageTitles, state: current }),
      state: current,
      updatedAt: new Date().toISOString(),
    }));
    console.log('[AG Studio] saved report', saved.name, current);
  };
  const discard = () =>
    load(saved, reportState.pageToSelect(saved.state, state.selectedPageId));
  // Anything that leaves the current report or edit mode asks first when it has unsaved changes.
  const guard = (then: () => void) => {
    const api = apiRef.current;
    if (api && reportState.hasChanges(api.getState(), saved.state)) {
      setDialog({ kind: 'unsaved', then });
    } else then();
  };

  // --- Reports ----------------------------------------------------------------------
  const openReport = (id: string) => {
    const report = findReport(reports, id);
    if (report && id !== saved.id) guard(() => load(report));
  };
  const createReport = (name: string) => {
    const report = blankReport(name);
    update((current) => upsert(current, report));
    load(report, report.state.selectedPageId, 'edit');
  };
  const duplicateReport = (id: string) =>
    guard(() => {
      const source = findReport(reports, id);
      if (!source) return;
      const copy = copyOf(source);
      update((current) => upsert(current, copy));
      load(copy);
    });
  const resetDemo = () => {
    update(initialReports);
    load(defaultReport(), undefined, 'view');
  };
  const deleteReport = (report: SavedReport) => {
    update((current) => remove(current, report.id));
    if (report.id !== saved.id) return;
    const { reports: next, activeId } = latest();
    load(findReport(next, activeId) ?? next[0]);
  };
  const renameReport = (id: string, name: string) =>
    editReport(id, (report) => ({ ...report, name }));

  // --- Pages ------------------------------------------------------------------------
  // Studio leaves page navigation to the host, and its state has no page names. Page names are
  // saved as soon as they change; new pages are numbered until they're named.
  const selectPage = (id: string, pageId: string) => {
    if (id === saved.id) updateState((s) => reportState.selectPage(s, pageId));
    else {
      const report = findReport(reports, id);
      if (report) guard(() => load(report, pageId));
    }
  };
  const addPage = () => {
    const id = newId('page');
    updateState((s) => reportState.addPage(s, id));
    // A new page is empty, so open edit mode to fill it.
    if (mode !== 'edit') changeMode('edit');
    return id;
  };
  const removePage = (id: string) =>
    updateState((s) => reportState.removePage(s, id));
  const renamePage = (id: string, title: string) =>
    editReport(saved.id, (report) => ({
      ...report,
      pageTitles: { ...report.pageTitles, [id]: title },
    }));

  useEffect(() => {
    openPage.set((title) => {
      const id = addPage();
      renamePage(id, title);
      return id;
    });
  });

  const editing = mode === 'edit';
  const pages = pagesFor({ pageTitles: saved.pageTitles, state });

  return (
    <AppShell
      sidebar={
        <ReportsSidebar
          reports={reports}
          activeId={saved.id}
          activePages={pages}
          selectedPageId={state.selectedPageId}
          editing={editing}
          ready={studioState !== null}
          onSelectReport={openReport}
          onSelectPage={selectPage}
          onAddPage={() => (apiRef.current ? addPage() : undefined)}
          onRemovePage={removePage}
          onRenamePage={renamePage}
          onRenameReport={renameReport}
          onCreate={() => guard(() => setDialog({ kind: 'create' }))}
          onDuplicate={duplicateReport}
          onDelete={(id) => {
            const report = findReport(reports, id);
            if (report) setDialog({ kind: 'delete', report });
          }}
          onReset={() => setDialog({ kind: 'reset' })}
        />
      }
    >
      <ReportHeader
        reportName={saved.name}
        pageTitle={pages.find((p) => p.id === state.selectedPageId)?.title}
        asOf={data.asOf}
        editing={editing}
        pageIsEmpty={studioState !== null && !reportState.pageHasWidgets(state)}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={() => apiRef.current?.undo()}
        onRedo={() => apiRef.current?.redo()}
        onSave={save}
        onDiscard={discard}
        onEditingChange={(next) =>
          next ? changeMode('edit') : guard(() => changeMode('view'))
        }
        onAsk={ai ? askDirector : undefined}
        firstVisit={visit.first && !askedOnce}
        news={visit.news}
      />

      <div className="min-h-0 flex-1">
        {hasData(data) ? (
          <AgStudioProvider licenseKey={licenseKey} modules={ai ? [AgStudioAiModule] : undefined}>
            <AgStudio<GratiaRegistry>
              style={{ height: '100%', width: '100%' }}
              theme={agStudioPayPalTheme}
              widgets={gratiaWidgets}
              layout={{ widgetBorderEnabled: true }}
              data={studioData}
              ai={ai}
              aiToolDisplay={toolDisplay}
              localeText={STUDIO_TEXT}
              initialState={initialState}
              mode={mode}
              onApiReady={(event) => {
                apiRef.current = event.api;
              }}
              onStudioReady={(event) => {
                const current = event.api.getState();
                console.log('[AG Studio] initial state', current);
                setStudioState(current);
              }}
              onStateUpdated={(event) => {
                console.log('[AG Studio] state updated', event.state);
                const { undo, redo } = event.api.getHistory();
                setStudioState(event.state);
                setHistory({ canUndo: undo.length > 0, canRedo: redo.length > 0 });
              }}
            />
          </AgStudioProvider>
        ) : (
          <EmptyData />
        )}
      </div>

      <UnsavedChangesDialog
        open={dialog?.kind === 'unsaved'}
        reportName={saved.name}
        onCancel={() => setDialog(null)}
        onDiscard={() => {
          discard();
          if (dialog?.kind === 'unsaved') dialog.then();
          setDialog(null);
        }}
        onSave={() => {
          save();
          if (dialog?.kind === 'unsaved') dialog.then();
          setDialog(null);
        }}
      />
      <CreateReportDialog
        open={dialog?.kind === 'create'}
        onClose={() => setDialog(null)}
        onCreate={(name) => {
          setDialog(null);
          createReport(name);
        }}
      />
      <DeleteReportDialog
        report={dialog?.kind === 'delete' ? dialog.report : null}
        onCancel={() => setDialog(null)}
        onConfirm={(report) => {
          deleteReport(report);
          setDialog(null);
        }}
      />
      <ResetDemoDialog
        open={dialog?.kind === 'reset'}
        builtInName={defaultReport().name}
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          resetDemo();
          setDialog(null);
        }}
      />
      {approvalDialog}
      {arrival && <GiftToast gift={arrival} onDismiss={dismissArrival} />}
    </AppShell>
  );
}
