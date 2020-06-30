const assert = require("assert")
const assertType = require("./assert_type.js")

// Exponential backoff (for async attempt functions).
//
// Required args:
//  initialBackoff_s:  The initial backoff delay after the first failure.
//  giveUpAfter_s:
//    If an attempt ends after this much time has elapsed, we stop trying.  If a
//    new attmpet would be scheduled after this time, instead schedule it sooner
//    for exactly the "give up" time.  This means the last attempt will start at
//    (negligibly after) the "give up" time and finish noticeably after.
//
//  attemptFunc:
//    The *async* function to run for each attempt (see resetFunc too, it's
//    handy!).  Return true to indicate stop trying.  Return false to indicate
//    continuing to trying.
//
// Optional args:
//  base: base of exponentiation, defaults to 2 to double backoff each time.
//  resetFunc:
//    *async* function to call to prepare for a new attempt, called before all
//    attempts except the first.
//
// Returns: {ok, delay_s}
async function exponential(args) {
	const { initialBackoff_s, giveUpAfter_s, attemptFunc } = args
	let { resetFunc, base } = args

	assertType.number(initialBackoff_s)
	assertType.number(giveUpAfter_s)
	assertType.func(attemptFunc)

	base = base || 2
	assertType.number(base)

	resetFunc = resetFunc || (async () => {})
	assertType.func(resetFunc)

	const startTime_ms = new Date().getTime()
	const giveUpTime_ms = startTime_ms + giveUpAfter_s * 1000
	for (let i = 0; ; ++i) {
		if (await attemptFunc()) {
			return {
				ok: true,
				delay_s: (new Date().getTime() - startTime_ms) / 1000.0,
			}
		}

		const currentTime_ms = new Date().getTime()
		if (currentTime_ms > giveUpTime_ms) {
			return {
				ok: false,
				delay_s: (new Date().getTime() - startTime_ms) / 1000.0,
			}
		}

		const nextAttemptTime_ms = Math.min(
			startTime_ms + 1000 * initialBackoff_s * base ** i,
			giveUpTime_ms
		)
		const delay = Math.max(0, nextAttemptTime_ms - currentTime_ms)
		await new Promise((resolve) => setTimeout(resolve, delay))

		await resetFunc()
	}

	assert.fail("Should never get here.")
}

exports.exponential = exponential
