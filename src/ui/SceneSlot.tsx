import type { Ref } from 'react'
import { StatusPill } from './components/common/StatusPill'
import type {
  CrewMemberViewModel,
  SceneStatus,
} from './types/uiViewModel'

interface SceneSlotProps {
  status: SceneStatus
  crew: CrewMemberViewModel[]
  mountRef?: Ref<HTMLDivElement>
}

const CREW_ACCENTS = [
  'bg-violet-400 shadow-violet-400/50',
  'bg-emerald-400 shadow-emerald-400/50',
  'bg-cyan-300 shadow-cyan-300/50',
  'bg-amber-300 shadow-amber-300/50',
]

export function SceneSlot({
  status,
  crew,
  mountRef,
}: SceneSlotProps) {
  const isReady = status === 'ready'
  const isFailed = status === 'failed'

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-500/40 bg-slate-950 shadow-2xl shadow-black/30">

      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/90 px-4 py-3 sm:px-5">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-orange-300">
            Crew Visual Feed · Habitat 01
          </p>

          <h2 className="mt-1 text-sm font-bold tracking-wide text-white sm:text-base">
            Mars Command Deck
          </h2>
        </div>

        <StatusPill
          tone={
            isReady
              ? 'success'
              : isFailed
                ? 'danger'
                : 'warning'
          }
        >
          {isReady
            ? 'Phaser Scene Connected'
            : isFailed
              ? 'Static Scene Fallback'
              : 'Scene Art Preview'}
        </StatusPill>
      </header>

      {/* MAIN SCENE */}
      <div
        className="relative isolate aspect-video min-h-62.5 w-full overflow-hidden bg-[#111820] sm:min-h-82.5 lg:min-h-97.5"
        aria-label="ENAM crew command deck scene"
      >

        {/* BACKGROUND IMAGE */}
        <img
          src="/images/enam-crew-command-deck.webp"
          alt="Four ENAM crew members inside their Mars habitat command deck."
          className="absolute inset-0 z-0 h-full w-full select-none object-cover object-center"
          loading="eager"
          draggable={false}
        />

        {/* DARK OVERLAY */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-1 bg-[linear-gradient(180deg,rgba(2,6,23,0.72)_0%,rgba(2,6,23,0.08)_24%,rgba(2,6,23,0.03)_58%,rgba(2,6,23,0.86)_100%)]"
        />

        {/* EDGE SHADOW */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-1 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(2,6,23,0.38)_100%)]"
        />

        {/* TOP INFORMATION */}
        <div className="pointer-events-none absolute left-3 right-3 top-3 z-20 flex items-start justify-between gap-2 sm:left-5 sm:right-5 sm:top-4">

          <div className="rounded-lg border border-white/15 bg-slate-950/55 px-2.5 py-2 shadow-lg backdrop-blur-md sm:px-3">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-cyan-200 sm:text-[9px]">
              Surface Operations
            </p>

            <p className="mt-0.5 text-[10px] font-bold tracking-wide text-white sm:text-xs">
              COMMAND DECK
              <span className="text-slate-400"> / </span>
              MARS
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">

            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-slate-950/65 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-200 shadow-lg backdrop-blur-md sm:text-[9px]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isFailed ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />

              {isReady
                ? 'Scene Online'
                : isFailed
                  ? 'Artwork Fallback'
                  : 'Habitat Preview'}
            </span>

            <span className="rounded-full border border-white/15 bg-slate-950/55 px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider text-slate-200 backdrop-blur-md">
              {crew.length.toString().padStart(2, '0')} Crew Aboard
            </span>

          </div>
        </div>

        {/* PHASER MOUNT POINT */}
        <div
          ref={mountRef}
          data-phaser-mount="outpost"
          aria-label="Phaser outpost scene mount point"
          className={`absolute inset-0 z-10 h-full w-full overflow-hidden [&_canvas]:block! [&_canvas]:h-full! [&_canvas]:w-full! ${
            isReady ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        />

        {/* CREW STATUS OVERLAY */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex flex-col gap-2 sm:inset-x-5 sm:bottom-4 sm:flex-row sm:items-end sm:justify-between">

          <div className="max-w-full rounded-xl border border-white/15 bg-slate-950/65 px-3 py-2.5 shadow-xl backdrop-blur-md sm:max-w-[70%] sm:px-4">

            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-orange-300 sm:text-[9px]">
              Crew Status
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">

              {crew.slice(0, 4).map((member, index) => (
                <span
                  key={member.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-slate-100 sm:text-[9px]"
                  title={`${member.name} · ${member.role} · ${member.availability}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full shadow ${
                      CREW_ACCENTS[index % CREW_ACCENTS.length]
                    }`}
                  />

                  {member.name}
                </span>
              ))}

            </div>
          </div>

          <div className="self-end rounded-lg border border-white/10 bg-slate-950/60 px-2.5 py-2 text-right backdrop-blur-md">

            <p className="text-[7px] font-black uppercase tracking-[0.18em] text-slate-400">
              Visual Environment
            </p>

            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-100">
              Habitat Interior · Sol Mission Preview
            </p>

          </div>
        </div>

        {/* PHASER ERROR FALLBACK */}
        {isFailed && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 flex -translate-y-1/2 justify-center px-4">
            <span className="rounded-lg border border-amber-300/30 bg-slate-950/85 px-3 py-2 text-center text-[10px] font-semibold text-amber-100 shadow-xl backdrop-blur-md">
              Phaser is unavailable. Showing crew scene artwork.
            </span>
          </div>
        )}

      </div>

      {/* FOOTER */}
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-slate-950/75 px-4 py-2.5 text-[8px] font-semibold uppercase tracking-[0.13em] text-slate-500 sm:px-5">

        <span>ENAM · Mars Habitat 01</span>

        <span>
          {isReady
            ? 'Interactive Scene Layer Connected'
            : 'Illustration Placeholder · Awaiting Phaser Scene'}
        </span>

      </footer>

    </section>
  )
}