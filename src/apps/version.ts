/** "2026.11": the version every built-in app reports in Get Info. */
export function appVersion() {
	const now = new Date();
	return `${now.getFullYear()}.${now.getMonth() + 1}`;
}
