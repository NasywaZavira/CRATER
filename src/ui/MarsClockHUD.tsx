import { useEffect, useState } from 'react'
import { IconifyIcon } from './IconifyIcon'
import {
  calculateMarsTime,
  MARS_SITE_LABEL,
  MARS_SOL_LENGTH_EARTH_DAYS,
  MARS_SITE_LONGITUDE_WEST_DEG,
} from './time/marsTime'

interface MarsClockHUDProps {
  missionDay: number
  totalMissionDays: number
}

export function MarsClockHUD({ missionDay, totalMissionDays }: MarsClockHUDProps) {
  const [reading, setReading] = useState(() => calculateMarsTime(new Date()))

  useEffect(() => {
    const updateClock = () => setReading(calculateMarsTime(new Date()))
    updateClock()
    // One displayed Mars clock-second lasts about 1.02749 Earth seconds.
    const marsClockSecondMs = MARS_SOL_LENGTH_EARTH_DAYS * 1_000
    const intervalId = window.setInterval(updateClock, marsClockSecondMs)
    return () => window.clearInterval(intervalId)
  }, [])

  const longitudeLabel = `${Math.abs(MARS_SITE_LONGITUDE_WEST_DEG).toFixed(1)}°${MARS_SITE_LONGITUDE_WEST_DEG >= 0 ? 'W' : 'E'}`

  return (
    <section
      aria-label="Mars local mean solar time and sol count"
      className="relative grid h-[112px] w-[112px] shrink-0 place-items-center rounded-full border-[3px] border-slate-400/75 bg-[radial-gradient(circle_at_34%_25%,#46515c_0%,#222d39_48%,#111923_78%)] shadow-[inset_0_0_0_4px_rgba(15,23,42,0.9),inset_0_0_24px_rgba(0,0,0,0.72),0_8px_24px_rgba(0,0,0,0.35)] sm:h-[124px] sm:w-[124px]"
      title="Calculated from the system clock using the NASA GISS Mars24 mean-solar-time algorithm."
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-[5px] rounded-full border border-slate-300/15" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-[10px] rounded-full border border-cyan-200/10" />
      <div className="relative flex flex-col items-center px-2 text-center">
        <div className="flex items-center gap-1 text-[7px] font-black uppercase tracking-[0.14em] text-slate-300 sm:text-[8px]">
          <IconifyIcon icon="mdi:clock-time-four-outline" size={11} className="text-cyan-200" />
          Mars local time
          <span className="rounded border border-cyan-200/20 bg-cyan-200/10 px-1 py-0.5 text-[6px] text-cyan-100">LMST</span>
        </div>
        <span className="mt-1 font-mono text-[17px] font-black tabular-nums tracking-tight text-white sm:text-[19px]">
          {reading.clock}
        </span>
        <span className="mt-0.5 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-2 py-0.5 font-mono text-[8px] font-bold tracking-[0.12em] text-cyan-100">
          MSD {reading.solNumber.toLocaleString('en-US')}
        </span>
        <span className="mt-1 text-[7px] font-bold uppercase tracking-[0.1em] text-slate-400">
          Mission {missionDay}/{totalMissionDays} · {longitudeLabel}
        </span>
      </div>
      <span className="sr-only">{MARS_SITE_LABEL}, longitude {longitudeLabel}. This global Mars Sol Date (MSD) is not the ENAM mission day counter.</span>
    </section>
  )
}
