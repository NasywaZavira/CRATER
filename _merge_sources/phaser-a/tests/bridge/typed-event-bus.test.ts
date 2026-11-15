import { describe, expect, it, vi } from 'vitest';
import { TypedEventBus } from '../../src/bridge/typed-event-bus';
import { sceneSnapshotFixture } from '../../src/contracts/fixtures';

describe('TypedEventBus', () => {
  it('mengirim payload ke listener', () => {
    const bus = new TypedEventBus();
    const fn = vi.fn();
    bus.on('enam:scene-snapshot', fn);
    bus.emit('enam:scene-snapshot', sceneSnapshotFixture);
    expect(fn).toHaveBeenCalledWith(sceneSnapshotFixture);
  });

  it('unsubscribe dari on() melepas listener (cleanup saat unmount)', () => {
    const bus = new TypedEventBus();
    const fn = vi.fn();
    const off = bus.on('enam:scene-ready', fn);
    expect(bus.listenerCount('enam:scene-ready')).toBe(1);
    off();
    bus.emit('enam:scene-ready', { ready: true });
    expect(fn).not.toHaveBeenCalled();
    expect(bus.listenerCount('enam:scene-ready')).toBe(0);
  });

  it('emit snapshot yang sama dua kali tidak merusak apa pun (idempotent di sisi bus)', () => {
    const bus = new TypedEventBus();
    const received: unknown[] = [];
    bus.on('enam:scene-snapshot', (s) => received.push(JSON.stringify(s)));
    bus.emit('enam:scene-snapshot', sceneSnapshotFixture);
    bus.emit('enam:scene-snapshot', sceneSnapshotFixture);
    expect(received[0]).toBe(received[1]);
  });

  it('handler yang off() dirinya sendiri saat emit tidak membuat listener lain terlewat', () => {
    const bus = new TypedEventBus();
    const second = vi.fn();
    const off = bus.on('enam:scene-ready', () => off());
    bus.on('enam:scene-ready', second);
    bus.emit('enam:scene-ready', { ready: true });
    expect(second).toHaveBeenCalledTimes(1);
  });
});
