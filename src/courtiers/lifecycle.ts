/**
 * Courtier Lifecycle — state machine for courtier status transitions.
 */

import type { CourtierStatus } from "../types.ts";
import { VALID_TRANSITIONS } from "../types.ts";
import { InvalidTransitionError } from "../errors/palace-errors.ts";

export class CourtierLifecycle {
  private _status: CourtierStatus;
  readonly name: string;

  constructor(name: string, initialStatus: CourtierStatus) {
    this.name = name;
    this._status = initialStatus;
  }

  get status(): CourtierStatus {
    return this._status;
  }

  /** Attempt a state transition. Returns previous status or throws if invalid. */
  transition(to: CourtierStatus): CourtierStatus {
    const allowed = VALID_TRANSITIONS[this._status];
    if (!allowed.includes(to)) {
      throw new InvalidTransitionError(this.name, this._status, to, allowed);
    }
    const previous = this._status;
    this._status = to;
    return previous;
  }

  /** Check if a transition is valid without performing it */
  canTransition(to: CourtierStatus): boolean {
    return VALID_TRANSITIONS[this._status].includes(to);
  }
}
