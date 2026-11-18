/** A visitor's best score per game, kept in this browser only. */
export function readBest(game: string): number {
	try {
		return Number(localStorage.getItem(`ep-best-${game}`)) || 0;
	} catch {
		return 0;
	}
}

/** Saves `score` if it beats the stored best; returns the best after saving. */
export function saveBest(game: string, score: number): number {
	const best = readBest(game);
	if (score <= best) return best;
	try {
		localStorage.setItem(`ep-best-${game}`, String(score));
	} catch {}
	return score;
}
